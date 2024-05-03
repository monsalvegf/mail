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
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Obtener los correos electrónicos del servidor
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    if (emails.length === 0) {
      document.querySelector('#emails-view').innerHTML += `<p>No emails in this mailbox.</p>`;
    }

    // Crear un elemento para cada correo electrónico
    emails.forEach(email => {
      const element = document.createElement('div');
      element.className = 'email';
      element.innerHTML = `<b>${email.sender}</b> ${email.subject} <span class="timestamp">${email.timestamp}</span>`;
      element.addEventListener('click', () => load_email(email.id, mailbox));
      document.querySelector('#emails-view').append(element);
    });
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

    // Crear elementos para mostrar el correo electrónico
    const element = document.createElement('div');
    element.innerHTML = `
      <p><strong>From:</strong> ${email.sender}</p>
      <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
      <p><strong>Subject:</strong> ${email.subject}</p>
      <p><strong>Sent at:</strong> ${email.timestamp}</p>
      <button class="btn btn-sm btn-outline-primary" id="reply-button">Reply</button>
      <hr>
      <p>${email.body}</p>
    `;
    document.querySelector('#email-view').append(element);

    // Marcar el correo electrónico como leído
    if (mailbox === 'inbox' && !email.read) {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });
    }

    // Agregar un event listener para el botón de respuesta
    document.querySelector('#reply-button').addEventListener('click', () => reply_email(email));
  });
}




