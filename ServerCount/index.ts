// myPlugin.ts

import { VendettaAPI } from 'vendetta-api';

const vendettaAPI = new VendettaAPI('YOUR_API_KEY');

async function showServerCount() {
  try {
    const userInfo = await vendettaAPI.getUserInfo('681211840293896236');
    const serverCount = userInfo.serverCount;

    // Create a new element to display the server count
    const serverCountElement = document.createElement('div');
    serverCountElement.textContent = `Servers: ${serverCount}`;
    serverCountElement.style.color = 'white'; // Adjust styling as needed

    // Find the home icon (hypothetical example, replace with actual selector)
    const homeIcon = document.querySelector('.home-icon');

    // Insert the server count element below the home icon
    if (homeIcon) {
      homeIcon.parentNode?.appendChild(serverCountElement);
    } else {
      console.error('Home icon not found.');
    }
  } catch (error) {
    console.error('Error fetching server count:', error);
  }
}

// Call the function
showServerCount();
