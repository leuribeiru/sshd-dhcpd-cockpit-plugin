# sshd-dhcpd-cockpit-plugin

## Visão Geral
Plugin para o cockpit que permite a configuração e monitoramento dos serviços SSH e DHCP através de uma interface web.

## Instalação do cockpit
Para instalar o plugin é preciso ter o cockpit instalado na máquina que deseja monitorar

Instale o cockpit:
```
yum -y install cockpit
```

Ative o cockpit:
```
systemctl enable --now cockpit.socket
```

Teste se o cockpit esta funcionando, acesse de outra máquina, pelo navegador, a url:

[ip_maquina_cockpit]:9090

Uma tela como esta deve ser exibida
![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/1.png?raw=true)


## Instalação do plugin
Baixe neste repositório o arquivo [sshd-dhcpd-cockpit-1.0-1.el8.noarch.rpm](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/sshd-dhcpd-cockpit-1.0-1.el8.noarch.rpm?raw=true)

Instale no seu servidor RedHat:
```
rpm -ihv sshd-dhcpd-cockpit-1.0-1.el8.noarch.rpm
```

As pastas, correspondentes aos 2 serviços seram copiadas para o diretório de plugins do cockpit, que na distribuição Red Hat fica em **/usr/share/cockpit**.

Se preferir você pode copiar as duas pastas manualmente para o endereço correspondente aos plugins do seu cockpit.

Teste novamente, em outra máquina, em um navegador, pela url:

[ip_maquina_cockpit]:9090

Faça o login, uma tela como esta será exibida, com os 2 serviços adicionados ao menu
![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/2.png?raw=true)

## Monitorando o estado dos serviços
Assim que um dos serviços é acessado, ele verifica se o serviço está instalado, caso não esteja instalado é possível instalar através do botão **Instalar**, caso já esteja instalado este botão exibira o texto **Instalado**.

Logo abaixo, exibe o status do serviço, se esta **Rodando**, **Quebrado** ou **Parado**. É possível alterar estes valores para **Rodando** ou **Parado** manualmente.

É possível ainda **Habilitar** ou **Desabilitar** que o serviço inicie automaticamente.

Os mesmos recursos estão presentes nos 2 plugins

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/3.png?raw=true)

## Configurando o SSHD
Nas configurações do SSHD é possível restringir a interface de acesso e informar uma porta de acesso.

Por padrão, o acesso é permitido em todas as interfaces, ou seja, se este valor ficar em branco, o serviço estará acessível em qualquer interface disponível. Se o valor para a porta de acesso ficar em branco, a porta de entrada será a 22.

É possível configurar o arquivo que vai gerenciar as chaves de autorização de acesso, se for alterar este valor certifique-se de que o arquivo informado existe.

É possível ativar ou desativar o acesso com usuário "root" e o Redirecionamento de conexões X11.

Ao aplicar as configurações o serviço será reiniciado

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/4.png?raw=true)

## Gerenciamento de Chaves de acesso
Nessa seção são exibidas os hosts que tem acesso com chave pelo serviço SSHD do usuário corrente (logado no cockpit) de acordo com o arquivo informado na configuração da seção anterior. É possível eliminar o acesso por chave da lista de hosts com acesso permitido por chave, é necessário Aplicar as Alterações na Lista de Chaves, e o serviço será reiniciado.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/5.png?raw=true)

## Gerenciamento de Conexões ativas
Nesta seção são exibidas as conexões, via SSH, que estão atualmente ativas no servidor onde o cockpit esta rodando

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/6.png?raw=true)

## Configurando o DHCPD

### Configurações gerais
Nas configurações gerais do DHCP é possível informar o DNS primário, DNS secundário, Domínio, tempo de locação padrão e tempo máximo de locação:

O DNS secundário só será aplicado caso exista um DNS primário.

Aplicar estas configurações fará com que o serviço reinicie.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/7.png?raw=true)

### Configurações de subrede
Nessa seção informamos o endereço da rede, a mascara, o range de IPs automáticos e o gateway. Se algum valor for informado errado nesta seção o serviço pode *"Falhar"* e ficar com status **Quebrado**, por exemplo, se a mascara não corresponder ao endereço da subrede.

Aplicar estas configurações irá reiniciar o serviço

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/8.png?raw=true)

##Configurar IP Fixo:
É possível fixar o IP de alguma máquina informando o MAC da placa de rede, e qual o IP que será atribuído, além de um nome para identificação. É possível também excluir configurações de IP fixos já feitas anteriormente. É preciso aplicar as alterações na feitas na Lista de IP fixos. O serviço será reiniciado.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/9.png?raw=true)

##Monitorar os clientes conectados
Nesta seção é possível visualizar o IP, nome do host e endereço MAC de todos os clientes que receberam um IP automático, e que estão ativos.

![](https://github.com/leuribeiru/sshd-dhcpd-cockpit-plugin/blob/main/images/10.png?raw=true)
