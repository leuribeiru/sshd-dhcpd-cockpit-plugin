let btn_install;
let input_enabled;
let input_start;
let status_service;
let enabled_service;

let dns1;
let dns2;
let domain_name;
let default_lease;
let max_lease;
let btn_apply_setup;

let subnet;
let netmask;
let range_init;
let range_final;
let gateway;
let btn_apply_setup_subnet;

let file_dhcpd_conf;
let sub_net_sector;

let host;
let mac;
let fixed_address;
let btn_refresh_fixed_address;
let btn_add_fixed_address;
let fixed_address_table;
let btn_apply_fixed_address;
let savedFixedAddresses;
let currentFixedAddresses;

let table_clients_conections;
let btn_refresh_clients_conections;

let user;
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
    dns1 = document.getElementById("dns1");
    dns2 = document.getElementById("dns2");
    domain_name = document.getElementById("domain_name");
    default_lease = document.getElementById("default_lease");
    max_lease = document.getElementById("max_lease");
    btn_apply_setup = document.getElementById("btn_apply_setup");

    addEventListenersSetup();
}

function addEventListenersSetup(){
    btn_apply_setup.addEventListener("click", onClickApplySetup);
}

function setElementsSetupSubnet(){
    subnet = document.getElementById("subnet");
    netmask = document.getElementById("netmask");
    range_init = document.getElementById("range_init");
    range_final = document.getElementById("range_final");
    gateway = document.getElementById("gateway");
    btn_apply_setup_subnet = document.getElementById("btn_apply_setup_subnet");

    addEventListenersSetupSubnet();
}


function addEventListenersSetupSubnet(){
    btn_apply_setup_subnet.addEventListener("click", onClickApplySetupSubnet);
}

function setElementsFixedAddress(){
    host = document.getElementById("host")
    mac = document.getElementById("mac");
    fixed_address = document.getElementById("fixed_address");
    btn_add_fixed_address = document.getElementById("btn_add_fixed_address");
    fixed_address_table = document.getElementById("fixed_address_table");
    btn_refresh_fixed_address = document.getElementById("btn_refresh_fixed_address");
    btn_apply_fixed_address = document.getElementById("btn_apply_fixed_address");
    
    addEventListenersFixedAddress();
}

function addEventListenersFixedAddress(){
    btn_add_fixed_address.addEventListener("click", onClickAddHost);
    btn_apply_fixed_address.addEventListener("click", onClickApplyFixedAddresses);
    btn_refresh_fixed_address.addEventListener("click", loadFixedAddress);
}


function setElementsClientsConections(){
    table_clients_conections = document.getElementById("table_clients_conections");
    btn_refresh_clients_conections = document.getElementById("btn_refresh_clients_conections");

    addEventListenerClientsConections();
}

function addEventListenerClientsConections(){
    btn_refresh_clients_conections.addEventListener("click", loadClientsConections);
}
/*********** START CHECKS *************************/

function checkInstalledService(){
    cockpit.spawn(["systemctl", "status", "dhcpd"])
	    .stream(installedService)
}

function checkService() {
    cockpit.spawn(["systemctl", "status", "dhcpd"])
        .stream(checkStatus)
}

async function installedService(data){
    console.log("installed_service");
    if(data.includes("DHCPv4 ")){
        btn_install.setAttribute("disabled", "true");
	    btn_install.innerText = "Instalado";
        show_properties.style.display = 'block';
        
        checkService();
        loadClientsConections();

        await loadDhcpdFile();
        loadDhcpdSubnetConfig();
        loadFixedAddress();

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

function checkClientsConections(){

}

/******************* END CHECKS ***********************/

/******************* START ACTIONS ********************/

function installService(){
    btn_install.setAttribute("disabled", "true");
    btn_install.innerText = "Instalando...";
    cockpit.spawn(["yum", "-y", "install", "dhcp-server"])
        .stream( function(resp){
            console.log(resp);
        }).then(checkInstalledService)
}

function setEnabled(){
    cockpit.spawn(["systemctl", "enable", "dhcpd"])
}

function setDisabled(){
    cockpit.spawn(["systemctl", "disable", "dhcpd"])
}

function setStart(){
    cockpit.spawn(["systemctl", "start", "dhcpd"]);
}

function setStop(){
    cockpit.spawn(["systemctl", "stop", "dhcpd"]);
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
    await loadDhcpdFile();
    loadDhcpdSubnetConfig();
    setStart();
    checkService();
}

async function onClickApplySetupSubnet(){
    await saveConfigSubnet();
    setStop();
    checkService();
    await loadDhcpdFile();
    loadDhcpdSubnetConfig();
    setStart();
    checkService();
}

async function onClickApplyFixedAddresses(){
    await saveFixedAddressList();
    setStop();
    checkService();
    await loadDhcpdFile();
    loadFixedAddress();
    setStart();
    checkService();
}

/******************* END CLICKS ***********************/

/******************** START LOAD CONFIG ****************/

async function loadDhcpdFile(){
    file_dhcpd_conf = await cockpit.file('/etc/dhcp/dhcpd.conf').read();
}

function loadDhcpdSubnetConfig(){

    dns1.value = "";
    dns2.value = "";
    domain_name.value = "";
    default_lease.value = "";
    max_lease.value = "";

    subnet.value = "";
    netmask.value = "";
    range_init.value = "";
    range_final.value = "";
    gateway.value = "";


    inside_subnet_function = false;
    sub_net_sector = "";

    for (const line of file_dhcpd_conf.split('\n')){
        
        const currentLine = line.trim()
        if(currentLine[0] !== "#" ){
            if(inside_subnet_function === true){
                
                sub_net_sector += line + '\n';
                getRange(currentLine);
                getGateway(currentLine);
                if(currentLine[currentLine.length-1] === '}'){
                    inside_subnet_function = false;
                }
                    
                
            }else{
                if(currentLine.includes("subnet") && currentLine.includes("netmask") 
                            && currentLine[currentLine.length-1] === '{' ){
                    sub_net_sector += line + '\n';
                    getSubnet(currentLine);
                    getNetmask(currentLine);
                    inside_subnet_function = true;
                }else{
                    getDns(currentLine);
                    getDomain(currentLine);
                    getDefaultLease(currentLine);
                    getMaxLease(currentLine);
                }

            }
        }
    };
}

function getSubnet(line){
    const lineSplited = line.split(' ');
    if(lineSplited[0].trim() === "subnet"){
        subnet.value = lineSplited[1].trim();
    }
}

function getNetmask(line){
    const lineSplited = line.split(' ');
    if(lineSplited[2].trim() === "netmask"){
        netmask.value = lineSplited[3].trim();
    }
}

function getRange(line){
    const splited = line.replace(';','').split(' ');
    if(splited.length === 3){
        if(splited[0] === "range"){
            range_init.value = splited[1];
            range_final.value = splited[2];
        }
    }
}

function getDns(line){
    const splited = line.replace(';','').split(' ');
    if(splited.length >= 3){
        if(splited[0] === "option" && splited[1] === "domain-name-servers"){
            if(splited[2])
                dns1.value = splited[2].replace(',', '')
            if(splited[3]){
                dns2.value = splited[3]
            }
        }
    }
}

function getDomain(line){
    const splited = line.replace(';','').split(' ');
    if(splited.length === 3){
        if(splited[0] === "option" && splited[1] === "domain-name"){
            domain_name.value = splited[2].replace('\"','').replace('\"','');
        }
    }
}

function getGateway(line){
    const splited = line.replace(';','').split(' ');
    if(splited.length === 3){
        if(splited[0] === "option" && splited[1] === "routers"){
            gateway.value = splited[2];
        }
    }
}

function getDefaultLease(line){
    const splited = line.replace(';','').split(' ');
    if(splited.length === 2){
        if(splited[0] === "default-lease-time"){
            default_lease.value = splited[1];
        }
    }
}

function getMaxLease(line){
    const splited = line.replace(';','').split(' ');
    if(splited.length === 2){
        if(splited[0] === "max-lease-time"){
            max_lease.value = splited[1];
        }
    }
}

/******************** END LOAD CONFIG  ******************/

/******************** START SET CONFIG  *****************/

async function saveConfigSubnet(){
    const newConfig = generateSubnetString();
    //const currentFile = await cockpit.file('/etc/dhcp/dhcpd.conf').read();
    const currentFile = file_dhcpd_conf;
    let newContent = "";
    if(sub_net_sector === ""){
        newContent = currentFile + '\n\n' + newConfig;
    }else{
        newContent = currentFile.replace(sub_net_sector, newConfig);
    }
    let result = await cockpit.file('/etc/dhcp/dhcpd.conf').replace(newContent);
    console.log(result);
}


function generateSubnetString(){
    let generatedString = "";
    
    generatedString += `subnet ${subnet.value !== "" ? subnet.value : "0.0.0.0"} netmask ${netmask.value !== "" ? netmask.value : "0.0.0.0"} {\n`;
    
    if(range_init.value !== "" && range_final.value !== ""){
        generatedString += `  range ${range_init.value} ${range_final.value};\n`;
    }
    if(gateway.value !== ""){
        generatedString += `  option routers ${gateway.value};\n`;
    }
    generatedString += '}\n';
    return generatedString;
}

async function saveConfig(){

    const lines = file_dhcpd_conf.trim().split('\n');
    let inside_subnet_function = false;

    let domainChange = false;
    let dnsChange = false;
    let defaultLeaseTimeChange = false;
    let maxLeaseTimeChange = false;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        
        
        if(lines[index].trim()[0] !== "#" ){

            if(!inside_subnet_function){
                if(line.includes("subnet") && line.includes("netmask") 
                            && line[line.length-1] === '{' ){
                    inside_subnet_function = true;
                }

                
                let currentSentence = "option domain-name";
                if(line.includes(currentSentence)){
                    const domainSplited = line.trim().split(' ');
                    if(domainSplited[0] === "option" && domainSplited[1] === "domain-name"){
                        if(domain_name.value.trim() !== ""){
                            lines[index] = `${currentSentence} \"${domain_name.value}\";`;
                        }else{
                            lines[index] = "";
                        }
                        domainChange = true;
                    }
                }

                currentSentence = "option domain-name-servers";
                if(line.includes(currentSentence)){
                    const dnsSplited = line.trim().split(' ');
                    if(dnsSplited[0] === "option" && dnsSplited[1] === "domain-name-servers"){
                        if(dns1.value.trim() !== ""){
                            let dnsString = `${currentSentence} ${dns1.value}`;
                            if(dns2.value !== ""){
                                dnsString += `, ${dns2.value}`;
                            }
                            dnsString += ";"
                            lines[index] = dnsString;
                        }else{
                            lines[index] = "";
                        }
                        dnsChange = true;
                    }
                }


                currentSentence = "default-lease-time";
                if(line.includes(currentSentence)){
                    if(default_lease.value.trim() !== ""){
                        lines[index] = `${currentSentence} ${default_lease.value};`;
                    }else{
                        lines[index] = "";
                    }
                    defaultLeaseTimeChange = true;
                }

                currentSentence = "max-lease-time";
                if(line.includes(currentSentence)){
                    if(max_lease.value.trim() !== ""){
                        lines[index] = `${currentSentence} ${max_lease.value};`;
                    }else{
                        lines[index] = "";
                    }
                    maxLeaseTimeChange = true;
                }

            }else{
                if(line[line.length-1] === '}'){
                    inside_subnet_function = false;
                }
            }

        }

    }

    if(domainChange === false){
        console.log("dominio")
        if(domain_name.value.trim() !== ""){
            lines.push(`option domain-name \"${domain_name.value}\";\n`)
        }
    }
    
    if(dnsChange === false){
        console.log("dns")
        if(dns1.value.trim() !== ""){
            let dnsString = `option domain-name-servers ${dns1.value}`;
            if(dns2.value !== ""){
                dnsString += `, ${dns2.value}`;
            }
            dnsString += ";\n"
            lines.push(dnsString);
        }
        
    }
    
    if(defaultLeaseTimeChange === false){
        console.log("lease")
        if(default_lease.value.trim() !== ""){
            lines.push(`default-lease-time ${default_lease.value};\n`)
        }
    }
    
    if(maxLeaseTimeChange === false){
        console.log("max")
        if(max_lease.value.trim() !== ""){
            lines.push(`max-lease-time ${max_lease.value};\n`)
        }
    }

    const newContent = lines.join('\n');
    let result = await cockpit.file('/etc/dhcp/dhcpd.conf').replace(newContent);
    console.log(result);
    
}


/************************* END SET CONFIG **********************/

/********************* START LOAD FIXED ADDRESS *****************/

function loadFixedAddress(){

    const fileDhcpdSplited = file_dhcpd_conf.split('\n');

    let hostFinded = false;
    
    let currentHost = null;
    let currentMac = null;
    let currentFixedAddress = null;

    currentFixedAddresses = [];
    savedFixedAddresses = [];
    let savedString = "";

    for (const line of fileDhcpdSplited) {
        
        const lineTrim = line.trim()
        if(lineTrim[0] !== "#"){
            if(hostFinded === false){
                if(lineTrim.split(' ')[0].includes("host") && lineTrim[lineTrim.length-1] === '{'){
                    savedString += `${line}\n`;
                    currentHost = lineTrim.split(' ')[1];
                    hostFinded = true;
                }
            }else{
                if(lineTrim.includes("hardware ethernet")){
                    savedString += `${line}\n`;
                    currentMac = lineTrim.replace(';','').split("hardware ethernet")[1];
                }
                if(lineTrim.includes("fixed-address")){
                    savedString += `${line}\n`;
                    currentFixedAddress = lineTrim.replace(';','').split("fixed-address")[1];
                }
                if(lineTrim[lineTrim.length-1] === '}'){
                    
                    savedString += `${line}\n`;
                    savedFixedAddresses.push(savedString);

                    const host = {
                        hostName: currentHost,
                        mac: currentMac,
                        fixedAddress: currentFixedAddress
                    }
                    currentFixedAddresses.push(host);
                    
                    savedString = "";
                    currentHost = null;
                    currentMac = null;
                    currentFixedAddress = null;
                    hostFinded = false;
                }
            }
        }
    }

    populateFixedAddressesTable();
}

/********************* END LOAD FIXED ADDRESS *****************/

/************ START POPULATING FIXED ADDRESSES LIST ***********/

function populateFixedAddressesTable(){

    fixed_address_table.innerHTML = "";

    for (let index = 0; index < currentFixedAddresses.length; index++) {
        const host = currentFixedAddresses[index];

        const dflex = document.createElement('div');
        dflex.className = "list-group-item d-flex flex-wrap justify-content-between";
        fixed_address_table.appendChild(dflex);

        const td = document.createElement('div');
        td.className = "p-2";
        dflex.appendChild(td)
        const hostName = document.createTextNode(host.hostName)
        td.appendChild(hostName)
        
        const td2 = document.createElement('div');
        td2.className = "p-2";
        dflex.appendChild(td2)
        const mac = document.createTextNode(host.mac)
        td2.appendChild(mac)
        
        const td3 = document.createElement('div');
        td3.className = "p-2";
        dflex.appendChild(td3)
        const fixedAddress = document.createTextNode(host.fixedAddress)
        td3.appendChild(fixedAddress)
        
        const td4 = document.createElement('div');
        td4.className = "p-2";
        dflex.appendChild(td4)
        const btnDelete = document.createElement('button')
        td4.appendChild(btnDelete)

        btnDelete.innerText = "Remover";
        btnDelete.classList.add('btn')
        btnDelete.classList.add('btn-danger')
        btnDelete.setAttribute("id", index);
        btnDelete.addEventListener("click", onClickDeleteHost);
    }

}

function onClickDeleteHost(event){
    const index = event.target.getAttribute('id');
    currentFixedAddresses.splice(index, 1);
    populateFixedAddressesTable();
}

function onClickAddHost(){
    const newHost = {
        hostName: host.value,
        mac: mac.value,
        fixedAddress: fixed_address.value
    }
    currentFixedAddresses.push(newHost);
    populateFixedAddressesTable();
}

/************ END POPULATING FIXED ADDRESSES LIST **************/

/***************** START SAVE FIXED ADRESSES LIST  **************/


 async function saveFixedAddressList(){
    let resultToSave = file_dhcpd_conf
    for (const host of savedFixedAddresses) {
        resultToSave = resultToSave.replace(host, '');
    }
    for (const newHost of currentFixedAddresses){
        let newString = "";
        newString += `host ${newHost.hostName} {\n`;
        newString += `  hardware ethernet ${newHost.mac};\n`;
        newString += `  fixed-address ${newHost.fixedAddress};\n}\n`;
        resultToSave += newString;
    }

    const result = await cockpit.file('/etc/dhcp/dhcpd.conf').replace(resultToSave);
    console.log(result);
 }

/****************** END SAVE FIXED ADDRESSES LIST ***************/

/******************* START LOAD CLIENTS CONECTIONS  ************/


async function loadClientsConections(){
    const file_clients_conection = await cockpit.file('/var/lib/dhcpd/dhcpd.leases').read();

    const clientsConectionSplited = file_clients_conection.split('\n');

    let insideLease = false;
    let currentIp = null;
    let currentHostname = null;
    let currentMac = null;
    let currentStart = null;
    let currentEnd = null;

    let clients_conection_list = [];

    for (const line of clientsConectionSplited) {
        const lineTrim = line.trim();
        if(!insideLease){
            if(lineTrim.includes("lease") && lineTrim[lineTrim.length-1] === '{'){
                currentIp = lineTrim.split(' ')[1];
                
                insideLease = true;
            }
        }else{

            if(lineTrim.includes("client-hostname")){
                currentHostname = lineTrim.replace(';','').split(' ')[1].replace('\"','').replace('\"','');
            }
            if(lineTrim.includes("hardware ethernet")){
                currentMac = lineTrim.replace(';','').split('hardware ethernet')[1];
            }
            if(lineTrim.includes("starts")){
                const lineTrimSplited = lineTrim.replace(';','').split(' ');
                currentStart = lineTrimSplited[2] + " " + lineTrimSplited[3] + " -" + lineTrimSplited[1] + "H";
            }
            if(lineTrim.includes("ends")){
                const lineTrimSplited = lineTrim.replace(';','').split(' ');
                currentEnd = lineTrimSplited[2] + " " + lineTrimSplited[3] + " -" + lineTrimSplited[1] + "H";
            }

            if(lineTrim[lineTrim.length-1] === '}'){
                let client = {
                    ip: currentIp,
                    hostName: currentHostname,
                    mac: currentMac,
                    start: currentStart,
                    end: currentEnd,
                    active: currentHostname !== null ? true : false
                }

                let clientFinded = false;
                for (let index = 0; index < clients_conection_list.length; index++) {
                    
                    if(clients_conection_list[index].ip === client.ip){
                        clients_conection_list[index] = client;
                        clientFinded = true;
                        break;
                    }
                }
                if(clientFinded === false){
                    clients_conection_list.push(client)
                }

                currentIp = null;
                currentHostname = null;

                insideLease = false;
            }
        }
        
    }

    populateClientsConections(clients_conection_list);
}

/******************* END LOAD CLIENTS CONECTIONS  ************/

/*************** START POPULATE CLIENTS CONECTIONS ************/

function populateClientsConections(data){

    table_clients_conections.innerHTML = "";

    for(const item of data){

        if(item.active){

            const dflex = document.createElement('div');
            dflex.className = "list-group-item d-flex flex-wrap justify-content-between";
            table_clients_conections.appendChild(dflex);
            
            const div = document.createElement('div')
            div.className = "p-2";
            dflex.appendChild(div)
            const ip = document.createTextNode(item.ip);
            div.appendChild(ip);
            
            const div2 = document.createElement('div')
            div2.className = "p-2";
            dflex.appendChild(div2);
            const name = document.createTextNode(item.hostName === null ? "" : item.hostName);
            div2.appendChild(name);
            
            
            const div3 = document.createElement('div')
            div3.className = "p-2";
            dflex.appendChild(div3);
            const mac = document.createTextNode(item.mac);
            div3.appendChild(mac);
            
        }
        
    }
}

/*************** END POPULATE CLIENTS CONECTIONS ************/

function showAlert(){
    let div = document.createElement("div");
    div.className = "alert alert-danger";

    div.innerHTML = "<h4>Por padrão estas configurações só podem ser acessadas/modificadas pelo usuário <b>\"root\"</b>.</h4>" + 
    "<p>Usuário corrente: <b>" + user.full_name + "</b>.</p>";

    user_alert.appendChild(div);
}

cockpit.transport.wait(function() {
    
    setElementsDefault();
    setElementsSetup();
    setElementsSetupSubnet();
    setElementsFixedAddress();
    setElementsClientsConections();

    cockpit.user().then( (userCockpit) =>{
        user = userCockpit;
        console.log(user)
        if(user !== null && user.full_name === "root"){
            user_alert.style.display = 'none';
        }else{
            user_alert.style.display = 'block';
            showAlert();
        }
    });
    
    checkInstalledService();
});
