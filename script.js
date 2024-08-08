// Generate a random name for the device
const deviceName = `Device_${Math.random().toString(36).substring(2, 8)}`;
document.getElementById('devices').innerText = `Your Device Name: ${deviceName}`;

let localConnection;
let remoteConnection;
let sendChannel;
let receiveChannel;

// Function to handle file selection
document.getElementById('fileInput').addEventListener('change', handleFileInput);

function handleFileInput(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('File selected:', file.name);
    }
}

// Function to establish WebRTC connection
async function createConnection() {
    localConnection = new RTCPeerConnection();
    sendChannel = localConnection.createDataChannel('sendDataChannel');
    sendChannel.onopen = handleSendChannelStatusChange;
    sendChannel.onclose = handleSendChannelStatusChange;

    localConnection.onicecandidate = e => {
        if (e.candidate) {
            remoteConnection.addIceCandidate(e.candidate);
        }
    };

    remoteConnection = new RTCPeerConnection();
    remoteConnection.ondatachannel = receiveChannelCallback;

    remoteConnection.onicecandidate = e => {
        if (e.candidate) {
            localConnection.addIceCandidate(e.candidate);
        }
    };

    const offer = await localConnection.createOffer();
    await localConnection.setLocalDescription(offer);
    await remoteConnection.setRemoteDescription(offer);

    const answer = await remoteConnection.createAnswer();
    await remoteConnection.setLocalDescription(answer);
    await localConnection.setRemoteDescription(answer);
}

function handleSendChannelStatusChange(event) {
    if (sendChannel) {
        const state = sendChannel.readyState;
        console.log(`Send channel state: ${state}`);
    }
}

function receiveChannelCallback(event) {
    receiveChannel = event.channel;
    receiveChannel.onmessage = handleReceiveMessage;
    receiveChannel.onopen = handleReceiveChannelStatusChange;
    receiveChannel.onclose = handleReceiveChannelStatusChange;
}

function handleReceiveMessage(event) {
    const receivedFile = new Blob([event.data]);
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(receivedFile);
    downloadLink.download = 'received_file';
    downloadLink.textContent = 'Download received file';
    document.body.appendChild(downloadLink);
}

function handleReceiveChannelStatusChange(event) {
    if (receiveChannel) {
        console.log(`Receive channel state: ${receiveChannel.readyState}`);
    }
}

// Function to send a file
document.getElementById('sendButton').addEventListener('click', sendFile);

function sendFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (file && sendChannel.readyState === 'open') {
        sendChannel.send(file);
        console.log('File sent:', file.name);
    }
}

// Start the connection when the page loads
createConnection();
