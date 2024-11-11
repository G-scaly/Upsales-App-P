(async function init() {
  const client = await app.initialized();  // Declare 'client' in this function scope
  client.events.on('app.activated', function() {
      setupApp(client);  // Pass 'client' explicitly to setupApp
  });
})();

/**
* Set up the Sync Button and trigger contact display
*/
async function setupApp(client) {
  // Resize the app in the ticket sidebar
  client.instance.resize({ height: "85px" });
  console.log("App activated");
  await setupSyncButton(client); // Pass 'client' to setupSyncButton
}

/**
* Set up the Sync Button
*/
async function setupSyncButton(client) {
  const btnSyncContact = document.getElementById("btnSyncContact");
  btnSyncContact?.addEventListener("click", () => onSyncButtonClick(client)); // Pass 'client' to onSyncButtonClick
}

/**
* Handle the click event for the Sync Button
*/
async function onSyncButtonClick(client) {
  // Expand the app size dynamically after the button is clicked
  await client.instance.resize({ height: "450px" }); // App expands after click

  // Hide the Sync button after it has been clicked
  const btnSyncContact = document.getElementById("btnSyncContact");
  btnSyncContact.style.display = "none"; // Hide the button

  // Get the current ticket's ID and sender's email
  const ticket = await client.data.get("ticket");
  const senderEmail = ticket.ticket.sender_email; // Use sender's email

  // Fetch the Freshdesk contact using the email
  const freshdeskContact = await fetchFreshdeskContact(client, ticket.ticket.id);

  // Fetch the Upsales contact using the email
  const upsalesContact = await fetchUpsalesContact(client, senderEmail);
  if (upsalesContact) {
      console.log(`Upsales contact found for email: ${senderEmail}. Displaying contact.`);
      showNotification(client, "success", `Upsales contact found and displayed for ${senderEmail}.`);
      displayContacts(freshdeskContact, upsalesContact);  // Display contact details
  } else {
      showNotification(client, "info", "No Upsales contact found for the email.");
      // Directly displaying "No contact found" in the UI
      const contactInfoDiv = document.getElementById("upsalesContactInfo");
      contactInfoDiv.innerHTML = `<h3>Upsales Contact</h3><p>No contact found.</p>`;
  }
}

/**
* Fetch Freshdesk contact using the template
*/
async function fetchFreshdeskContact(client, ticketId) {
  const response = await client.request.invokeTemplate("getFreshdeskContact", {
      context: { ticketId: ticketId }
  });
  const freshdeskContact = JSON.parse(response.response);
  console.log("Fetched Freshdesk contact:", freshdeskContact);
  return freshdeskContact;
}

/**
* Fetch Upsales contact using the template
*/
async function fetchUpsalesContact(client, email) {
  const response = await client.request.invokeTemplate("getUpsalesContact", {
      context: { email: email }
  });
  const upsalesData = JSON.parse(response.response);
  console.log("Fetched Upsales contact:", upsalesData);

  // Check if Upsales data is available
  if (upsalesData.data && upsalesData.data.length > 0) {
      return upsalesData.data[0]; // Return the first contact found
  } else {
      return null; // Return null if no contact found
  }
}

/**
* Display Freshdesk and Upsales contact information in the UI
*/
function displayContacts(freshdeskContact, upsalesContact) {
  const contactInfoDiv = document.getElementById("upsalesContactInfo");

  // Display Upsales contact information
  contactInfoDiv.innerHTML = `
      <h3>Upsales Contact</h3>
      <div class="contact-row">
          <span class="contact-label">ID:</span>
          <span class="contact-data">${upsalesContact.id}</span>
      </div>
      <div class="contact-row">
          <span class="contact-label">Name:</span>
          <span class="contact-data">${upsalesContact.firstName} ${upsalesContact.lastName}</span>
      </div>
      <span class="contact-label">Phone Number:</span>
      <div class="contact-row">
          <span class="contact-data">${upsalesContact.phone || "no_phone_in_upsales"}</span>
      </div>
      <span class="contact-label">Company:</span>
      <div class="contact-row">
          <span class="contact-data">${upsalesContact.client?.name}</span>
      </div>
      <div class="contact-category">
          <span class="contact-label">Job Title:</span>
          <div class="contact-row">
              <span class="contact-data">${upsalesContact.title || "no_title_in_upsales"}</span>
          </div>
          <span class="contact-label">Account Manager:</span>
          <div class="contact-row">
              <span class="contact-data">${upsalesContact.regBy?.name}</span>
          </div>
      </div>`;
}

/**
* Show notification
*/
function showNotification(client, type, message) {
  client.interface.trigger("showNotify", { type, message });
}
