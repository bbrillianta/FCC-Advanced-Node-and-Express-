$(document).ready(function () {
  //global io
  let socket = io();

  socket.on('user', data => {
    $('#num-users').text(data.currentUsers + ' users online');
    let message = data.name + 
                  (data.connected ? ' has joined the chat.' : ' has left the chat.');
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });

  socket.on('chat message', data => {
    const { message, name } = data;
    $('#messages').append($('<li>').html(`${name}: ${message}`));
  })

  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();

    socket.emit('chat message', messageToSend);
    return false; // prevent form submit from refreshing page
  });
});
