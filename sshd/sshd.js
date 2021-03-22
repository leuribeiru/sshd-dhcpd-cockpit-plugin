let btn_install;
let input_enabled;
let input_start;
let status_service;
let enabled_service;
let show_properties;

let listen_address;
let port;
let authorized_keys_file;
let permit_root_login;
let x11_forwarding;
let btn_apply_setup;

let file_sshd_config;

let keys_allowed_file_url;
let keys_allowed_array;
let table_keys_allowed;
let btn_refresh_keys_allowed;
let btn_apply_keys_allowed;


let table_active_conections;
let btn_refresh_active_conections;

let ssh_connections;

let user;
let user_login;
let user_alert;

function setElementsDefault(){
    user_alert = document.getElementById("user_alert");
    show_properties = document.getElementById("show_properties");
    show_properties.style.display = 'none';
    btn_install = document.getElementById("btn_install");
    input_enabled = document.getElementById("input_enabled");
    input_start = document.getElementById("input_start");
    status_service = document.getElementById("status_service");
    enabled_service = document.getElementById("enabled_service");
    
    addEventListenersDefault();
}


function addEventListenersDefault(){
    btn_install.addEventListener("click", onClickInstall);
    input_enabled.addEventListener("click", onToggleEnable);
    input_start.addEventListener("click", onToggleStart);
}

function setElementsSetup(){
    listen_address = document.getElementById("listen_address");
    port = document.getElementById("port");
    authorized_keys_file = document.getElementById("authorized_keys_file");
    permit_root_login = document.getElementById("permit_root_login");
    x11_forwarding = document.getElementById("x11_forwarding");
    btn_apply_setup = document.getElementById("btn_apply_setup");

    addEventListenersSetup();
}

function addEventListenersSetup(){
    btn_apply_setup.addEventListener("click", onClickApplySetup);
}

function setElementsKeysAllowed(){
    table_keys_allowed = document.getElementById("table_keys_allowed");
    btn_apply_keys_allowed = document.getElementById("btn_apply_keys_allowed");
    btn_refresh_keys_allowed = document.getElementById("btn_refresh_keys_allowed");
    user_login = document.getElementById("user_login");
    addEventListenerKeysAllowed();
}

function addEventListenerKeysAllowed(){
    btn_refresh_keys_allowed.addEventListener("click", loadAndPopulateKeysAllowed);
    btn_apply_keys_allowed.addEventListener("click", applyChangesOnKeysAllowed)
}

function setElementsActiveConections(){
    table_active_conections = document.getElementById("table_active_conections");
    btn_refresh_active_conections = document.getElementById("btn_refresh_active_conections");

    addEventListenerActiveConections();
}

function addEventListenerActiveConections(){
    btn_refresh_active_conections.addEventListener("click", checkActiveConections);
}

/*********** START CHECKS *************************/

function checkInstalledService(){
    cockpit.spawn(["systemctl", "status", "sshd"])
	    .stream(installedService)
}

function checkService() {
    cockpit.spawn(["systemctl", "status", "sshd"])
        .stream(checkStatus)
}

function installedService(data){
    console.log("installed_service");   
    if(data.includes("OpenSSH")){
        btn_install.setAttribute("disabled", "true");
	    btn_install.innerText = "Instalado";
        show_properties.style.display = 'block';
        
        checkService();
        loadSshdConfig();
        checkActiveConections();
    }else{
        if(btn_install.hasAttribute("disabled")){
            btn_install.removeAttribute("disabled");
            btn_install.innerText = "Instalar";
            show_properties.style.display = 'none';
        }
    }
}

function checkStatus(data) {
    console.log("status_service");
    if(data.includes("Active: active (running)")){
	    status_service.innerText = "Rodando";
	    status_service.className = "text-success";
	    input_start.checked = true;
	    checkEnabled(data);
	    return;
    }
    if(data.includes("Active: inactive (dead)")){
        status_service.innerText = "Parado";
	    status_service.className = "text-warning";
        input_start.checked = false;
        checkEnabled(data);
        return;
    }
    if(data.includes("Active: activating (start)")){
        status_service.innerText = "Iniciando...";
	    status_service.className = "text-warning";
	    checkService();
	    return;
    }
    status_service.innerText = "Quebrado";
    status_service.className = "text-danger";
    input_start.checked = false;
    checkEnabled(data);
}

function checkEnabled(data){
    console.log("enabled_service");
    if(data.includes("disabled; vendor preset:")){
        enabled_service.innerText = "Desabilitado";
	    enabled_service.className = "text-warning";
	    input_enabled.checked = false
	    return;
    }
    if(data.includes("enabled; vendor preset:")){
        enabled_service.innerText = "Habilitado";
	    enabled_service.className = "text-success";
        input_enabled.checked = true;
        return;
    }
}

function checkActiveConections(){
    cockpit.spawn(["who"])
	    .stream(getSshConections)
}

/******************* END CHECKS ***********************/

/******************* START ACTIONS ********************/

function installService(){
    btn_install.setAttribute("disabled", "true");
    btn_install.innerText = "Instalando...";
    cockpit.spawn(["yum", "-y", "install", "openssh", "openssh-server", "openssh-clients"])
        .stream( function(resp){
                console.log(resp);
        }).then(checkInstalledService)
}

function setEnabled(){
    cockpit.spawn(["systemctl", "enable", "sshd"])
}

function setDisabled(){
    cockpit.spawn(["systemctl", "disable", "sshd"])
}

function setStart(){
    cockpit.spawn(["systemctl", "start", "sshd"]);
}

function setStop(){
    cockpit.spawn(["systemctl", "stop", "sshd"]);
}

/******************* END ACTIONS **********************/

/******************* START CLICK **********************/

function onClickInstall(){
    installService();
}

function onToggleEnable(){
    if(input_enabled.checked){
        enabled_service.innerText = "Habilitando...";
	    enabled_service.className = "text-warning";
        setEnabled();
    }else{
        enabled_service.innerText = "Desabilitando...";
	    enabled_service.className = "text-warning";
        setDisabled();
    }
    checkService();    
}

function onToggleStart(){
    if(input_start.checked){
        setStart();
    }else{
        setStop();
    }
    checkService()
}

async function onClickApplySetup(){
    await saveConfig();
    setStop();
    checkService();
    await loadSshdConfig();
    setStart();
    checkService();
}


/******************* END CLICKS ***********************/

/******************* START LOAD CONFIG *****************/

async function loadSshdConfig(){
    file_sshd_config = await cockpit.file('/etc/ssh/sshd_config').read();

    for (const line of file_sshd_config.split('\n')){

        getListenAddress(line);
        getPort(line);
        getAuthorizedKeysFile(line);
        getPermitRootLogin(line);
        getX11Forwarding(line);

    };

    loadAndPopulateKeysAllowed();
}

function getListenAddress(line){
    if(line.includes("ListenAddress")){
        const completeLine = line.split("ListenAddress")
        if(isTheAtribute(completeLine)){
            listen_address.value = completeLine[1].trim()
        }
    }
}

function getPort(line){
    if(line.includes("Port")){
        const completeLine = line.split("Port")
        if(isTheAtribute(completeLine)){
            port.value = completeLine[1].trim()
        }
    }
}

function getAuthorizedKeysFile(line){
    if(line.includes("AuthorizedKeysFile")){
        const completeLine = line.split("AuthorizedKeysFile")
        if(isTheAtribute(completeLine)){
            authorized_keys_file.value = completeLine[1].trim()
            keys_allowed_file_url = completeLine[1].trim();
        }
    }
}

function getPermitRootLogin(line){
    if(line.includes("PermitRootLogin")){
        const completeLine = line.split("PermitRootLogin")
        if(isTheAtribute(completeLine)){
            permit_root_login.checked = completeLine[1].trim() == "yes" ? true : false;
        }
    }
}

function getX11Forwarding(line){
    if(line.includes("X11Forwarding")){
        const completeLine = line.split("X11Forwarding")
        if(isTheAtribute(completeLine)){
            x11_forwarding.checked = completeLine[1].trim() == "yes" ? true : false;
        }
    }
}

function isTheAtribute(lineSplited){
    if(lineSplited[0].trim() === '' && lineSplited[1][0].trim() === ''){
        return true;
    }
    return false;
}
/******************* END LOAD CONFIG *******************/

/******************** START SET CONFIG *****************/

async function saveConfig(){

    let liAdWrited = false;
    let porWrited = false;
    let auKFWrited = false;
    let peRLWrited = false;
    let x11FWrited = false;

    const fileSplited = file_sshd_config.split('\n')
    for (let index = 0; index < fileSplited.length; index++) {
        const line = fileSplited[index];
        
        if(!liAdWrited){
            const liAd = setListenAddress(line);
            if(liAd !== null){
                fileSplited[index] = liAd;
                liAdWrited = true;
            }
        }
        
        if(!porWrited){
            const por = setPort(line);
            if(por !== null){
                fileSplited[index] = por;
                porWrited = true;
            }
        }
        
        if(!auKFWrited){
            const auKF = setAuthorizedKeysFile(line);
            if(auKF !== null){
                fileSplited[index] = auKF;
                auKFWrited = true;
            }
        }

        if(!peRLWrited){
            const peRL = setPermitRootLogin(line);
            if(peRL !== null){
                fileSplited[index] = peRL;
                peRLWrited = true;
            }
        }

        if(!x11FWrited){
            const x11F = setX11Forwarding(line);
            if(x11F !== null){
                fileSplited[index] = x11F;
                x11FWrited = true;
            }
        }
    };

    if(!liAdWrited){
        if(listen_address.value !== ''){
            fileSplited.add("ListenAddress " + listen_address.value);
        }else{
            fileSplited.add("#ListenAddress 0.0.0.0")
        }
    }
    if(!porWrited){
        if(port.value !== ''){
            fileSplited.add("Port " + port.value);
        }else{
            fileSplited.add("#Port 22");
        }
    }
    if(!auKFWrited){
        if(authorized_keys_file.value !== ''){
            fileSplited.add("AuthorizedKeysFile " + authorized_keys_file.value);
        }else{
            fileSplited.add("AuthorizedKeysFile .ssh/authorized_keys")
        }
    }
    if(!peRLWrited){
        fileSplited.add("PermitRootLogin " + (permit_root_login.checked === true ? "yes" : "no"));
    }
    if(!x11FWrited){
        fileSplited.add("X11Forwarding " + (x11_forwarding.checked === true ? "yes" : "no"))
    }

    const result = await cockpit.file('/etc/ssh/sshd_config').replace(fileSplited.join('\n'))
    console.log(result);
}


function setListenAddress(line){
    if(line.includes("ListenAddress")){
        const completeLine = line.split("ListenAddress")
        if(isTheAtributeLine(completeLine)){
            if(listen_address.value !== ''){
                return "ListenAddress " + listen_address.value;
            }else{
                return "#ListenAddress 0.0.0.0";
            }
        }
    }
    return null;
}

function setPort(line){
    if(line.includes("Port")){
        const completeLine = line.split("Port")
        if(isTheAtributeLine(completeLine)){
            if(port.value !== ''){
                return "Port " + port.value;
            }else{
                return "#Port 22"
            }
        }
    }
    return null;
}

function setAuthorizedKeysFile(line){
    if(line.includes("AuthorizedKeysFile")){
        const completeLine = line.split("AuthorizedKeysFile")
        if(isTheAtributeLine(completeLine)){
            if(authorized_keys_file.value !== ''){
                return "AuthorizedKeysFile " + authorized_keys_file.value;
            }else{
                return "AuthorizedKeysFile .ssh/authorized_keys";
            }
        }
    }
    return null;
}

function setPermitRootLogin(line){
    if(line.includes("PermitRootLogin")){
        const completeLine = line.split("PermitRootLogin")
        if(isTheAtributeLine(completeLine)){
            return "PermitRootLogin " + (permit_root_login.checked === true ? "yes" : "no");
        }
    }
    return null;
}

function setX11Forwarding(line){
    if(line.includes("X11Forwarding")){
        const completeLine = line.split("X11Forwarding")
        if(isTheAtributeLine(completeLine)){
            return "X11Forwarding " + (x11_forwarding.checked === true ? "yes" : "no");
        }
    }
    return null;
}

function isTheAtributeLine(lineSplited){
    if((lineSplited[0].trim() === '' || lineSplited[0].trim() === '#') && lineSplited[1][0].trim() === ''){
        return true;
    }
    return false;
}

/******************** END SET CONFIG ******************/

/******************** START GET SSH CONECTIONS  *******/


function getSshConections(data){
    
    ssh_connections = [];
    if(data != null && data.length > 0){
        console.log(data)
        for(const line of data.split('\n')){
            if (line.includes('pts')){
                ssh_connections.push(line)
            }
        }
    }

    populateActiveConections();
}

/**********************END GET SSH CONECTIONS **********/

/********** START POPULATING ACTIVE CONECTIONS ********/
function populateActiveConections(){
  
    table_active_conections.innerHTML = "";

    for(const line of ssh_connections){
        const div = document.createElement('div');
        div.className = "list-group-item d-flex flex-wrap justify-content-between";
        table_active_conections.appendChild(div);
        const text = document.createTextNode(line);
        div.appendChild(text);
    }
}

/********** END POPULATING ACTIVE CONECTIONS ********/

/******************** START LOAD AND POPULATE KEYS ALLOWED *******/

async function loadAndPopulateKeysAllowed(){
    
    user_login.innerText = user == null ? '' : user.full_name != null? `(${user.full_name})` : '';
    const url = user.home + "/" + keys_allowed_file_url;
    const keys_allowed_file = await cockpit.file(url).read() || "";

    keys_allowed_array = keys_allowed_file.split('\n');
    populateKeysAllowed();
}

function populateKeysAllowed(){
    table_keys_allowed.innerHTML = "";

    for (let index = 0; index < keys_allowed_array.length; index++) {
        const element = keys_allowed_array[index];

        if(element.trim() !== ''){

            const keyHost = element.split('= ')[1]
    
            const dflex = document.createElement('div');
            dflex.className = "list-group-item d-flex flex-wrap justify-content-between";
            table_keys_allowed.appendChild(dflex);

            const p1 = document.createElement('div');
            p1.className = "p-2";
            dflex.appendChild(p1);

            const p2 = document.createElement('div');
            p2.className = "p-2";
            dflex.appendChild(p2);

            const text = document.createTextNode(keyHost);
            p1.appendChild(text)

            const btnDelete = document.createElement('button')
            p2.appendChild(btnDelete)

            btnDelete.innerText = "Remover";
            btnDelete.className = "btn btn-danger";
            btnDelete.setAttribute("id", index);
            btnDelete.addEventListener("click", onClickDeleteKey);
        }
        
    }
}

function onClickDeleteKey(event){
    const index = event.target.getAttribute('id');
    keys_allowed_array.splice(index, 1);
    populateKeysAllowed();
}

async function applyChangesOnKeysAllowed(){
    const url = "/root/" + keys_allowed_file_url;
    const result = await cockpit.file(url).replace(keys_allowed_array.join('\n'))
    console.log(result);
    loadAndPopulateKeysAllowed();
}

/******************** END LOAD AND POPULATEKEYS ALLOWED *******/


function showAlert(){
    let div = document.createElement("div");
    div.className = "alert alert-danger";

    div.innerHTML = "<h5>Por padrão estas configurações só podem ser modificadas pelo usuário <b>\"root\"</b>.</h5>" + 
    "<p>Usuário corrente: <b>" + user.full_name + "</b></p>";

    user_alert.appendChild(div);
}


cockpit.transport.wait(function() {

    cockpit.user().then( (userCockpit) =>{
        user = userCockpit;
        if(user !== null && user.full_name === "root"){
            user_alert.style.display = 'none';
        }else{
            user_alert.style.display = 'block';
            showAlert();
        }
    });

    setElementsDefault();
    setElementsSetup();
    setElementsKeysAllowed();
    setElementsActiveConections();
    checkInstalledService();
});
