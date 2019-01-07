const url = `ws://178.20.156.145:3000`;
const webSocket = new WebSocket(url);

const connectBtn = document.querySelector('.button__connect');
const disconnectBtn = document.querySelector('.button__disconnect');

let nuclearState = [true, null, null, null];
let levers  = [];
let stopPoint = false;

let currentLever = 0;
let query = null;

function start() {
  connectBtn.disabled = true;
  connectBtn.classList.add('button__connect--disable');

  disconnectBtn.disabled = false;
  disconnectBtn.classList.remove('button__disconnect--disable');

  webSocket.onmessage = ({ data }) => {
    const parseData = JSON.parse(data);
    query = checkQuery(currentLever, parseData.stateId);
    
    console.log('---',  nuclearState);
    console.log('---', parseData);

    switch(true){
      case parseData.newState === 'poweredOff':
        showToken(parseData.token)
        stop();
        break;
      case typeof parseData.pulled === 'number':
        getLevers(parseData);
        if (currentLever < 3) {
          sendQuery(query);
          currentLever++;
        }
        break;
      case parseData.action === 'check':
        setState(parseData);
        break;
    }
  }

  webSocket.onopen = () => {console.log('---',  `Connection to socket: ${url}`)};

  webSocket.onerror = (error) => {
    alert(`Error: ${error.message}`);
  };


}

function stop() {
  webSocket.onclose = () => { console.log(`Connection closed`)};
  webSocket.close();

  connectBtn.disabled = false;
  connectBtn.classList.remove('button__connect--disable');

  disconnectBtn.disabled = true;
  disconnectBtn.classList.add('button__disconnect--disable');
}


function checkQuery(currentLever, id) {
  return {
    action: "check",
    'lever1': currentLever,
    'lever2': currentLever + 1,
    stateId: id
  };
}

function sendQuery(query) {
  webSocket.send(JSON.stringify(query));
}

function powerOffQuery(stateId) {
  return {
    action: 'powerOff',
    stateId,
  }
}

function setState({lever1, lever2, same }) {
  const setValue = same ? nuclearState[lever1] : !nuclearState[lever1];
  nuclearState[lever2] = setValue;

  setLevers(lever2, setValue);
}

function toggleSwitchImage(pulled) {
  const switch_element = document.querySelector(`.panel__lever--${pulled + 1}`);

  if(switch_element.classList.contains('panel__lever--on')) {
    switch_element.classList.remove('panel__lever--on');
    switch_element.classList.add('panel__lever--off');
  } else {
    switch_element.classList.remove('panel__lever--off');
    switch_element.classList.add('panel__lever--on');
  }
}

function getLevers({ pulled, stateId }) {
  const powerOff = powerOffQuery(stateId);

  if (typeof nuclearState[pulled] === 'boolean') {
    nuclearState[pulled] = !nuclearState[pulled];
    toggleSwitchImage(pulled);
  }

  if(stopPoint) {
    if (nuclearState.every((el, id) => el === levers[id])) {
      sendQuery(powerOff);
    }
  } else if (nuclearState.every(el => el === true) || nuclearState.every(el => el === false)) {
    sendQuery(powerOff);

    stopPoint = !stopPoint;
    levers = nuclearState.map(el => !el);
  }  

}

function setLevers(id, value) {
  const switch_element = document.querySelector(`.panel__lever--${id + 1}`);

  if (value) {
    switch_element.classList.add('panel__lever--on');
  } else {
    switch_element.classList.add('panel__lever--off');
  }
}

function showToken(token) {
  const tokenText = document.querySelector(`.token`);
        tokenText.innerHTML = `${token}`;
}


connectBtn.addEventListener('click', start);
disconnectBtn.addEventListener('click', stop);