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

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Add event listener to the send button
  document.querySelector('#send-button').removeEventListener('click', send_email); // Eliminar listener existente para evitar duplicados
  document.querySelector('#send-button').addEventListener('click', send_email);
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
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
  alert('Email sent successfully!');
  // Reiniciar el formulario y habilitar el botón nuevamente
  document.querySelector('#compose-form').reset();
  document.querySelector('#send-button').disabled = false;
})
.catch(error => {
  console.error('Failed to send email:', error);
  alert('Failed to send email.');
  // Habilitar el botón nuevamente en caso de error
  document.querySelector('#send-button').disabled = false;
});
}

