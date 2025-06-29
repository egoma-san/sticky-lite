// Manual test script for format toolbar
// To use: Copy and paste this into the browser console while on the sticky board

console.log('=== Format Toolbar Debug Test ===');

// Function to simulate clicking on a sticky note
function testStickySelection() {
  console.log('\n1. Testing sticky note selection...');
  
  const stickyNotes = document.querySelectorAll('[data-testid="sticky-note"]');
  console.log(`Found ${stickyNotes.length} sticky notes`);
  
  if (stickyNotes.length > 0) {
    console.log('Clicking on first sticky note...');
    const firstSticky = stickyNotes[0];
    
    // Simulate a click event
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    firstSticky.dispatchEvent(clickEvent);
    console.log('Click event dispatched');
    
    // Wait a bit for React to update
    setTimeout(() => {
      console.log('\n2. Checking for format toolbar...');
      
      // Look for the toolbar
      const toolbar = document.querySelector('.fixed.z-50.p-3.rounded-xl.shadow-2xl');
      
      if (toolbar) {
        console.log('✅ Format toolbar found!');
        console.log('Toolbar position:', {
          left: toolbar.style.left,
          top: toolbar.style.top
        });
        
        // Check toolbar contents
        const colorButtons = toolbar.querySelectorAll('button[title]');
        console.log(`Found ${colorButtons.length} color buttons`);
        
        const fontSizeSelect = toolbar.querySelector('select');
        console.log('Font size selector:', fontSizeSelect ? '✅ Found' : '❌ Not found');
        
        const formatButtons = toolbar.querySelectorAll('button[title*="Ctrl"]');
        console.log(`Found ${formatButtons.length} format buttons`);
      } else {
        console.log('❌ Format toolbar not found');
        console.log('Possible issues:');
        console.log('- Check console for React errors');
        console.log('- Verify selectedStickyIds state is set correctly');
        console.log('- Check if StickyFormatToolbar component is rendering');
      }
      
      // Test clicking on board to clear selection
      console.log('\n3. Testing selection clearing...');
      const boardCanvas = document.querySelector('[data-testid="board-canvas"]');
      if (boardCanvas) {
        console.log('Clicking on board canvas...');
        boardCanvas.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        }));
        
        setTimeout(() => {
          const toolbarAfterClear = document.querySelector('.fixed.z-50.p-3.rounded-xl.shadow-2xl');
          console.log('Toolbar after clear:', toolbarAfterClear ? '❌ Still visible' : '✅ Hidden');
        }, 100);
      }
    }, 100);
  } else {
    console.log('❌ No sticky notes found. Create a sticky note first.');
  }
}

// Run the test
testStickySelection();

console.log('\n=== End of test ===');
console.log('Check the console output above for debug messages from the React components.');