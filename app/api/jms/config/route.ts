import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to our JMS config file
const CONFIG_PATH = path.join(process.cwd(), 'lib/jms-config.json');

interface JMSConfig {
  antiToken: string;
  branchCode: string;
  financeCode: string;
  branchName: string;
  lastUpdated: string;
  isConfigured: boolean;
}

// Default config
const DEFAULT_CONFIG: JMSConfig = {
  antiToken: '',
  branchCode: '9632003',
  financeCode: '903',
  branchName: 'CP-LMYCC',
  lastUpdated: '',
  isConfigured: false
};

// Helper to read config
function getConfig(): JMSConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error reading JMS config:', error);
    return DEFAULT_CONFIG;
  }
}

// Helper to save config
function saveConfig(config: JMSConfig) {
  try {
    // Ensure lib directory exists
    const libDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving JMS config:', error);
    return false;
  }
}

// GET - Retrieve current config (without exposing full token)
export async function GET() {
  const config = getConfig();
  
  // Mask the token for security
  const maskedToken = config.antiToken 
    ? `${config.antiToken.slice(0, 8)}...${config.antiToken.slice(-4)}`
    : '';
  
  return NextResponse.json({
    success: true,
    config: {
      ...config,
      antiToken: maskedToken,
      hasToken: !!config.antiToken
    }
  });
}

// POST - Update config
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const currentConfig = getConfig();
    
    // Update config with new values
    const newConfig: JMSConfig = {
      antiToken: body.antiToken ?? currentConfig.antiToken,
      branchCode: body.branchCode ?? currentConfig.branchCode,
      financeCode: body.financeCode ?? currentConfig.financeCode,
      branchName: body.branchName ?? currentConfig.branchName,
      lastUpdated: new Date().toISOString(),
      isConfigured: !!(body.antiToken ?? currentConfig.antiToken)
    };
    
    const saved = saveConfig(newConfig);
    
    if (!saved) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save configuration' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'JMS configuration updated successfully',
      config: {
        ...newConfig,
        antiToken: `${newConfig.antiToken.slice(0, 8)}...${newConfig.antiToken.slice(-4)}`,
        hasToken: true
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to update configuration: ${error.message}` 
    }, { status: 500 });
  }
}

// DELETE - Clear config
export async function DELETE() {
  const saved = saveConfig(DEFAULT_CONFIG);
  
  if (!saved) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to clear configuration' 
    }, { status: 500 });
  }
  
  return NextResponse.json({
    success: true,
    message: 'JMS configuration cleared'
  });
}
