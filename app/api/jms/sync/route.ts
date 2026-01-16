import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// JMS API Configuration
const JMS_API_BASE = 'https://jmsgw.jtexpress.ph';
const JMS_WAYBILL_LIST_ENDPOINT = '/networkManagement/formsWaybill/shippingWaybillList';
const JMS_WAYBILL_COUNT_ENDPOINT = '/networkManagement/formsWaybill/shippingWaybillListCount';

// Path to config file
const CONFIG_PATH = path.join(process.cwd(), 'lib/jms-config.json');

// Helper to get stored token
function getStoredToken(): string | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      const config = JSON.parse(data);
      return config.antiToken || null;
    }
    return null;
  } catch {
    return null;
  }
}

interface JMSSyncRequest {
  antiToken: string;
  branchCode: string;       // e.g., "9632003"
  financeCode: string;      // e.g., "903"
  serviceType: 'VIP' | 'WALKIN' | '';
  dateStart: string;        // e.g., "2026-01-15 00:00:00"
  dateEnd: string;          // e.g., "2026-01-15 23:59:59"
}

interface JMSShipment {
  waybillNo: string;
  senderName?: string;
  receiverName?: string;
  deliveryTime?: string;
  pickOrgName?: string;
  [key: string]: any;
}

interface JMSResponse {
  code: number;
  msg: string;
  success: boolean;
  data: JMSShipment[];
  count?: { n: number };
}

// Helper to create form data for JMS API
function createJMSFormData(params: JMSSyncRequest): FormData {
  const formData = new FormData();
  
  formData.append('current', '1');
  formData.append('size', '500');  // Get up to 500 records
  formData.append('pickFranchiseeCode', params.branchCode);
  formData.append('pickFinanceCode', params.financeCode);
  formData.append('service', params.serviceType);
  formData.append('timeStart', params.dateStart);
  formData.append('timeEnd', params.dateEnd);
  formData.append('waybillNos', '');
  formData.append('customerCodes', '');
  formData.append('expressTypeCodes', '');
  formData.append('waybillNoType', '1');
  formData.append('isStation', '0');
  formData.append('ticketReceiptNo', '0');
  formData.append('isCompanid', '0');
  formData.append('deliveryTimeStart', params.dateStart);
  formData.append('deliveryTimeEnd', params.dateEnd);
  formData.append('networkCodes', '');
  
  return formData;
}

// Helper to call JMS API
async function callJMSAPI(endpoint: string, formData: FormData, antiToken: string): Promise<JMSResponse> {
  const response = await fetch(`${JMS_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'AntiToken': antiToken,
      'Cache-Control': 'max-age=0, must-revalidate',
      'Lang': 'en_US',
      'LangType': 'EN',
      'Origin': 'https://jms.jtexpress.ph',
      'Referer': 'https://jms.jtexpress.ph/',
      'Routename': 'sendWaybillSite',
      'Timezone': 'GMT+0800',
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`JMS API returned ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

export async function POST(req: Request) {
  try {
    const body: JMSSyncRequest = await req.json();
    
    // Try to get the token from request or from stored config
    let antiToken = body.antiToken;
    if (!antiToken) {
      antiToken = getStoredToken() || '';
    }
    
    // Validate required fields
    if (!antiToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'AntiToken is required. Please configure your JMS connection first.' 
      }, { status: 400 });
    }
    
    if (!body.branchCode || !body.financeCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Branch code and finance code are required.' 
      }, { status: 400 });
    }
    
    // Create form data for the request
    const formData = createJMSFormData(body);
    
    // First, get the count
    const countResponse = await callJMSAPI(JMS_WAYBILL_COUNT_ENDPOINT, formData, antiToken);
    
    if (!countResponse.success) {
      return NextResponse.json({ 
        success: false, 
        error: `JMS API Error: ${countResponse.msg}`,
        code: countResponse.code
      }, { status: 401 });
    }
    
    // Then get the actual data
    const listResponse = await callJMSAPI(JMS_WAYBILL_LIST_ENDPOINT, formData, antiToken);
    
    if (!listResponse.success) {
      return NextResponse.json({ 
        success: false, 
        error: `JMS API Error: ${listResponse.msg}`,
        code: listResponse.code
      }, { status: 401 });
    }
    
    // Process the data - count unique waybills
    const shipments = listResponse.data || [];
    const totalCount = shipments.length;
    
    // Extract date from the request (just the date part)
    const dateStr = body.dateStart.split(' ')[0];
    
    return NextResponse.json({
      success: true,
      data: {
        date: dateStr,
        serviceType: body.serviceType,
        branchCode: body.branchCode,
        count: totalCount,
        shipments: shipments.slice(0, 10), // Return first 10 for preview
        totalAvailable: countResponse.count?.n || totalCount
      }
    });
    
  } catch (error: any) {
    console.error('JMS Sync Error:', error);
    
    // Check for specific error types
    if (error.message?.includes('401') || error.message?.includes('403')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication failed. Your JMS session may have expired. Please update your AntiToken.',
        expired: true
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: `Failed to sync with JMS: ${error.message}` 
    }, { status: 500 });
  }
}

// GET endpoint to test connection
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'JMS Sync API is ready. Use POST with antiToken, branchCode, financeCode, serviceType, dateStart, and dateEnd.',
    example: {
      antiToken: 'your-jms-anti-token',
      branchCode: '9632003',
      financeCode: '903',
      serviceType: 'VIP',
      dateStart: '2026-01-15 00:00:00',
      dateEnd: '2026-01-15 23:59:59'
    }
  });
}
