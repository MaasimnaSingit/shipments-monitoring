/**
 * JMS VIP Counter Bookmarklet
 * 
 * HOW TO USE:
 * 1. Login to JMS (jms.jtexpress.ph)
 * 2. Go to Shipment Management
 * 3. Filter for VIP shipments for your branch/date
 * 4. Open Browser Console (F12 -> Console)
 * 5. Copy and paste this ENTIRE script
 * 6. Press Enter
 * 
 * The count will be sent to your Parcel Monitor dashboard!
 */

(function() {
  // Configuration - UPDATE THIS WITH YOUR DASHBOARD URL
  const DASHBOARD_URL = 'http://localhost:3000';
  const BRANCH = 'FLORIDA'; // Update to your active branch
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Try to find the total count from the page
  let count = 0;
  
  // Method 1: Check the pagination total
  const totalText = document.querySelector('.el-pagination__total');
  if (totalText) {
    const match = totalText.textContent.match(/Total\s*(\d+)/i);
    if (match) {
      count = parseInt(match[1]);
    }
  }
  
  // Method 2: Count table rows if pagination not found
  if (count === 0) {
    const rows = document.querySelectorAll('.el-table__body-wrapper tbody tr');
    count = rows.length;
  }
  
  // Method 3: Check if there's a count badge or summary
  if (count === 0) {
    const badges = document.querySelectorAll('.badge, .count, .total');
    badges.forEach(badge => {
      const num = parseInt(badge.textContent);
      if (!isNaN(num) && num > count) count = num;
    });
  }
  
  console.log(`%c JMS VIP Counter `, 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;');
  console.log(`Found: ${count} VIP shipments`);
  
  if (count === 0) {
    alert('⚠️ Could not find shipment count.\n\nMake sure you:\n1. Are on the Shipment Management page\n2. Have filtered for VIP\n3. Results are loaded');
    return;
  }
  
  // Ask for confirmation
  const confirmed = confirm(
    `📦 VIP Count Found: ${count}\n\n` +
    `Branch: ${BRANCH}\n` +
    `Date: ${today}\n\n` +
    `Send this to your Parcel Monitor dashboard?`
  );
  
  if (!confirmed) {
    console.log('Cancelled by user');
    return;
  }
  
  // Send to dashboard API
  fetch(`${DASHBOARD_URL}/api/parcels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      branch: BRANCH,
      vipCode: 'VIP',
      vipName: 'VIP Total',
      date: today,
      count: count,
      source: 'jms'
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(`✅ Success!\n\n${data.message}\n\nCheck your Parcel Monitor dashboard!`);
      console.log('%c ✅ Data sent successfully! ', 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;');
    } else {
      alert('❌ Failed: ' + data.error);
    }
  })
  .catch(error => {
    alert('❌ Error sending data:\n' + error.message + '\n\nMake sure your dashboard is running!');
    console.error('Send error:', error);
  });
})();
