document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Asegurarse de que el listener para el botón de envío de email se configura solo una vez al cargar la página
  document.querySelector('#send-button').addEventListener('click', send_email);

  // Cargar el último buzón usado desde sessionStorage o por defecto 'inbox'
  const lastMailbox = sessionStorage.getItem('lastMailbox') || 'inbox';
  load_mailbox(lastMailbox);
});


function compose_email(email = null) {
  // Mostrar la vista de redacción y ocultar otras vistas
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Asegurarse de que los campos están limpios si no hay email para responder
  document.querySelector('#compose-recipients').value = email && email.sender ? email.sender : '';
  document.querySelector('#compose-subject').value = email && email.subject ? (email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`) : '';
  
  if (email) {
    const formattedDate = new Date(email.timestamp).toLocaleString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
    });
    const replyHeader = `On ${formattedDate}, ${email.sender} wrote:\n>${email.body.replace(/\n/g, '\n>')}\n\n---\n\n`;
    // Añadir espacio para comenzar a escribir la respuesta
    document.querySelector('#compose-body').value = '\n\n' + replyHeader;  
  } else {
    document.querySelector('#compose-body').value = '';
  }

  // Colocar el foco y ajustar el desplazamiento
  const composeBody = document.querySelector('#compose-body');
  composeBody.focus();
  // Colocar el cursor al inicio del texto para comenzar la respuesta
  composeBody.setSelectionRange(0, 0);
  // Ajustar el desplazamiento al inicio del área de texto
  composeBody.scrollTop = 0;
}


function send_email() {
  // Obtener los datos del correo electrónico de los campos del formulario
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Enviar el correo electrónico a través de una solicitud POST
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
  .then(response => response.json())  // Convertir la respuesta en JSON
  .then(result => {
    // Verificar si el envío fue exitoso antes de proceder
    if (result.message === "Email sent successfully.") {
      console.log(result);
      // Actualizar sessionStorage antes de cargar el buzón
      sessionStorage.setItem('lastMailbox', 'sent');
      // Cargar la bandeja de enviados después de enviar el correo
      load_mailbox('sent');
    } else {
      // Manejar los posibles mensajes de error del servidor
      alert(`Error: ${result.error}`);
    }
  })
  .catch(error => {
    // Capturar y mostrar errores que podrían ocurrir al realizar la solicitud fetch
    console.error('Failed to send email:', error);
    alert('Failed to send email.');
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
    replyButton.onclick = () => compose_email(email);  // Usar 'onclick' y pasar directamente el email

    actionButtons.appendChild(replyButton);

    // Agregar botón de archivar/desarchivar según el buzón
    if (mailbox !== 'sent') {
      const archiveButton = document.createElement('button');
      archiveButton.className = 'btn btn-sm btn-outline-primary';
      archiveButton.textContent = mailbox === 'archive' ? 'Unarchive' : 'Archive';
      archiveButton.onclick = (event) => {
        event.stopPropagation(); 
        archiveEmail(email_id, mailbox !== 'archive');
      };
      actionButtons.appendChild(archiveButton);
    }

    emailContainer.appendChild(actionButtons);
    emailContainer.appendChild(emailContent);
    document.querySelector('#email-view').append(emailContainer);

    // Marcar el correo electrónico como leído
    if (mailbox === 'inbox' && !email.read) {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true })
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


