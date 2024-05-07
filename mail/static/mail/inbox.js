document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Add event listener to the send button (preparar el botón de envío)
  document.querySelector('#send-button').removeEventListener('click', send_email); // Eliminar listener existente para evitar duplicados
  document.querySelector('#send-button').addEventListener('click', send_email);
}


function send_email() {
  // Obtener el botón de envío y deshabilitarlo
  document.querySelector('#send-button').disabled = true;

  // Get the email data
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send the email
  fetch('/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'  // Especificando que el contenido es JSON
    },
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
.then(response => response.json())
.then(result => {
  console.log(result);
  // Cargar la bandeja de enviados después de enviar el correo
  load_mailbox('sent');
  
})
.catch(error => {
  console.error('Failed to send email:', error);
  alert('Failed to send email.');
  // Habilitar el botón nuevamente en caso de error
  document.querySelector('#send-button').disabled = false;
});
}


function load_mailbox(mailbox) {
  // Configuración inicial de la vista
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Obtener los correos electrónicos del servidor
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      if (emails.length === 0) {
          document.querySelector('#emails-view').innerHTML += `<p>No emails in this mailbox.</p>`;
      } else {
          emails.forEach(email => {
              const element = document.createElement('div');
              element.className = 'email';
              // Aplicar color de fondo dependiendo del estado del email
              element.style.backgroundColor = email.read ? '#d0d0d0' : '#ffffff'; // Gris si está leído, blanco si no
              element.innerHTML = `
                  <div class="email-details">
                      <strong>${email.sender}</strong> - ${email.subject}
                  </div>
                  <div class="email-timestamp">${email.timestamp}</div>
              `;
              element.addEventListener('click', () => load_email(email.id, mailbox));
              document.querySelector('#emails-view').append(element);
          });
      }
  })
  .catch(error => {
      console.error('Error loading emails:', error);
      document.querySelector('#emails-view').innerHTML = `<p>Error loading emails.</p>`;
  });
}



function load_email(email_id, mailbox) {
  document.querySelector('#email-view').innerHTML = '';
  // Mostrar la vista de correo electrónico y ocultar otras vistas
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Obtener el correo electrónico del servidor
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);

    // Crear contenedor para el correo electrónico
    const emailContainer = document.createElement('div');
    emailContainer.className = 'email-container';

    // Crear elementos para mostrar el correo electrónico
    const emailContent = document.createElement('div');
    emailContent.className = 'email-content';
    emailContent.innerHTML = `
      <p><strong>From:</strong> ${email.sender}</p>
      <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>Sent at:</strong> ${email.timestamp}</p>
      <hr>
      <p>${email.body}</p>
    `;

    // Botones de acción en la parte superior derecha
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    const replyButton = document.createElement('button');
    replyButton.className = 'btn btn-sm btn-outline-primary';
    replyButton.textContent = 'Reply';
    replyButton.addEventListener('click', () => reply_email(email));

    actionButtons.appendChild(replyButton);

    // Agregar botón de archivar/desarchivar según el buzón
    if (mailbox !== 'sent') {  // No agregar en correos enviados
      const archiveButton = document.createElement('button');
      archiveButton.className = 'btn btn-sm btn-outline-primary';
      archiveButton.textContent = mailbox === 'archive' ? 'Unarchive' : 'Archive';
      archiveButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Evitar que el evento se propague más
        archiveEmail(email_id, mailbox !== 'archive'); // Archivar si no está en archivo, desarchivar si está
      });
      actionButtons.appendChild(archiveButton);
    }

    emailContainer.appendChild(actionButtons);
    emailContainer.appendChild(emailContent);

    document.querySelector('#email-view').append(emailContainer);

    // Marcar el correo electrónico como leído
    if (mailbox === 'inbox' && !email.read) {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });
    }
  });
}


// Función para archivar o desarchivar correo
function archiveEmail(emailId, archive) {
  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      archived: archive
    })
  })
  .then(response => {
    if (response.ok) {
      load_mailbox('inbox'); // Siempre recargar el buzón de entrada después de archivar/desarchivar
    } else {
      alert('Error updating email status.');
    }
  })
  .catch(error => {
    console.error('Error updating email:', error);
    alert('Error updating email.');
  });
}


function reply_email(email) {
  // Mostrar la vista de redacción y ocultar otras vistas
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Rellenar el formulario de redacción
  document.querySelector('#compose-recipients').value = email.sender; // El receptor es el remitente original
  document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;

  // Formatear la fecha y hora del correo original para la cita
  const emailDate = new Date(email.timestamp);
  const formattedDate = emailDate.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });

  // Rellenar el cuerpo del correo con la cita del mensaje original
  document.querySelector('#compose-body').value = `On ${formattedDate}, ${email.sender} wrote:\n>${email.body.replace(/\n/g, '\n>')}\n\n`;

  // Situar el cursor al inicio del cuerpo para que el usuario pueda empezar a escribir su respuesta
  document.querySelector('#compose-body').focus();
  document.querySelector('#compose-body').setSelectionRange(0, 0);
}

