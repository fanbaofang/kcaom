/* 
 * mainҳ�湲��js
 * thatStyle() ���ַ��ֱ�ӷ����ַ�����Ϊ��Ĭ�Ϸ��
 * һЩ���÷�����html����дһ�鼴�ɣ�main_5�а���
 * 2020-10-12
 * ���½ű�
 */

/*
* ******************************************** ȫ�ֱ��� ***************************************
* *******************************************************************************************
*/
var mainPages = new TabPage("myTab", "myTabContent");
var mainDialogs = new Dialogs();
var mainMessages;
var mainSocketObj;
var mainIsOpenWebSocket = false;
var mainAgainTime = 5000;   // ��������ʱ��
var userID = '';
var username = '';
var g_softpublishId = '';
var lock = new LockPage();
var g_eventUrlData = null;
var isCNLanguage = false;//�Ƿ�Ϊ����
var isStartPageFinsh; //��ʼҳ������Ƿ����
var toggole = false;  //false ->С   true ->��
var leftMaxWidth = 150; //��
var leftMixWidth = 50;  //С
var g_isProduct = false;
var mainTimer = null;
var urlParam = getMainUrlParam(); //��¼url��������ֵ
var helpInfo = '' // �û�������ϢȨ��

//�������е�ϵͳ������
var g_systemConfig = new Map();
topWindow = window
//��¼��������������̣������жϽ��������Ƿ񵯳�
var flowExecIDMap = new Map();
var screenIdArr = [];
var bigscreenbrowseId = ''
//������Ļ��С�ı�
window.onresize = function () {
    if (sessionStorage.getItem('RPAUser') == 1 || urlParam.slefPage == 'true') return;
    pageWidth(true);
}

/*
* ******************************************** ˫������ ***************************************
* *******************************************************************************************
*/
var emergencymgr, energencyCount = 0, energencyNum = 0;
var isCancel = false, tipTimer = 0//�ӳ�ʱ��
var backup = {};
var r;
var productPath = ''//url��ת
var energencyBackupNum = 0;//"δ������Server"������������
window.backupLinkToMainBySwithButton = '';//˫������ȫ�ֱ���,�ڱ���ʱ,��������Ϊ��ť�л�ʱ,Ϊ1��������������������������󵯿������

/*
* **************************************** ��Ϣ���� ******************************************
* ********************************************************************************************
*/

function initMainMessage() {
    mainIsOpenWebSocket = getSystemConfigByName('��ҳWebSocket����').value == 1;
    mainMessages = new CPushMessages(lpfPushMessagesErrror, {
        mainIsOpenWebSocket: mainIsOpenWebSocket,
        isMainMsg: true
    });
    if (mainIsOpenWebSocket) {
        mainSocketObj = new CreateWebSocket();
    } else {
        mainMessages.getMessages();
    }

    //ע����ҳ�����Ϣ����
    mainMessages.regMessages(new CMainMessages(), [
        WM_IOCP_CONNECT, WM_WAITINPUT, WM_BACKUP_SERVER,
        WM_BACKUP_SWITCHB, WM_BACKUP_SWITCHM,
        WM_DISTRIBUTE_SERVER, WM_FORUM_MESSAGE_NEW,
        WM_FORUM_MESSAGE_READ, WM_FORUM_MESSAGE_DEL,
        WM_FLOW_CONFIRM, WM_FLOW_CONFIRMOBJ,
        WM_ESSENCE_MENU_ADD, WM_ESSENCE_MENU_DEL
    ], false);
}



function CMainMessages() {
    this.isClosed = function () {
        return window.closed;
    }
    // �������ֽ���web��Ϣ����
    if (urlParam.slefPage != 'true') {
        this.WndProc = function (msg, vPar) {
            switch (msg) {
                case WM_WAITINPUT: {
                    var src = $("#myTabContent .active iframe").attr('src')
                    var flowMap = flowExecIDMap.get(vPar.getStr('ExecID'))
                    if(vPar.getBool('bComponentBox')){
                        if(flowMap != undefined){
                            if(src.indexOf('&flowid='+ flowMap) == -1 || src.indexOf('funcs/flow/flowview.html') == -1){
                                return
                            }
                        }else{
                            if(src.indexOf('&execid='+ vPar.getStr('ExecID')) == -1){
                                return
                            }
                        }
                    }
                    if (vPar.getBool("UserLogin")) {
                        showWaitUserLogin(vPar.getStr('Caption'), vPar.getStr('ID'), undefined);
                    } else {
                        showWaitInput(
                        vPar.getStr('Caption'),
                        vPar.getStr('Text'),
                        vPar.getStr('Char'),
                        vPar.getStr('ID'),
                        vPar.getFileToBlobUrl('Pic'),
                        vPar.getBool('IsPassword'),
                        undefined,
                        vPar.getInt('Width'),
                        vPar.getInt('Height'),
                        vPar.getStr('Options')
                        );
                    }
                    break;
                }
                case WM_BACKUP_SERVER: {//����˫��������ַʱ
                    //��ȡ˫���������ݣ�����״�����ҳ���Ͽ�Server����ַΪ�����⡣
                    var vPar2 = new ParamArr();
                    callServerFunc("TSystemDM", "GetBackupServer", vPar2, lpfInitWindow2);
                    break;
                }
                case WM_BACKUP_SWITCHB:
                    {
                        break;
                    }
                case WM_BACKUP_SWITCHM:
                    {
                        break;
                    }
                case WM_DISTRIBUTE_SERVER:
                    {
                        break;
                    }
                case WM_FORUM_MESSAGE_NEW:
                    {
                        // �жϵ�ǰ�û��Ƿ���Ȩ�޽���
                        index = vPar.getStrList('MessageTo').indexOf(sessionStorage.getItem('user'));
                        if (vPar.has('MessageTo') && index != -1) {
                            var cont, icon;
                            if (vPar.getInt('MessageType') == 6) {// �½�
                                cont = strFormat('{0}�������µķ���', vPar.getStr('MessageFrom'));
                                icon = 'iconxinwen';
                            }
                            if (vPar.getInt('MessageType') == 7) {//�ظ�
                                cont = strFormat('{0}�ظ�����ķ���', vPar.getStr('MessageFrom'));
                                icon = 'iconxiaoxi1';
                            }
                            var str = '<div class="media" id="' + vPar.getStrList('MessageIDs')[index] + '" tid="' + vPar.getStr('FeedBackID') + '" hid="' + vPar.getStr('ReplyID') + '">' +
                                '<div class="media-left">' +
                                '<svg class="icon-svg" aria-hidden="true">' +
                                '<use xlink:href="#' + icon + '"></use>' +
                                '</svg>' +
                                '</div>' +
    
                                '<div class="media-body">' +
                                '<div class="media-heading">' + cont + '</div>' +
                                '<div class="media-bodying">' + vPar.getStr('CreateTime') + '</div>' +
                                '</div>' +
                                '</div>';
                            $('.messageList .list').append(str);
                            $('#msgView  h').text(parseInt($('#msgView  h').text()) + 1);
                            if ($('.messageList .media').length > 0) {
                                $('#msgView  h').removeClass('hidden');
                                $('.messageList .footer').removeClass('hidden');
                                $('.messageList .msg-empty').addClass('hidden');
                            }
                        }
                        break;
                    }
                case WM_FORUM_MESSAGE_READ:
                    {
                        msgForumOpt(vPar);
                        break;
                    }
                case WM_FORUM_MESSAGE_DEL:
                    {
                        msgForumOpt(vPar);
                        break;
                    }
                case WM_FLOW_CONFIRM:
                    {
                        showMsgUserConfirmLayer(vPar);
                        break;
                    }
                case WM_FLOW_CONFIRMOBJ: //���̽ڵ�ȷ��
                    {
                        var user = sessionStorage.getItem('user');
                        //�жϵ�ǰ�û��Ƿ�Ӧ�õ�������
                        var confirmIds = vPar.getStr('ConfirmUserID') || '';
                        if (confirmIds.indexOf(strFormat("'{0}'", user)) == -1) return;
                        //��ȡ��ǰȷ�Ϲ�������
                        var str = getSystemConfigByName('����ȷ�Ͻڵ�����').value;
                        var value = 1; //Ĭ��ֵ
                        if (/^\{\d\}/.test(str)) {
                            value = str.substring(1, 2);
                        }
                        if (!(vPar.getStr('User') && vPar.getStr('Pass')) && !vPar.getBool('OpenFlow') /*��������ʱ����*/ &&
                            (value == '1' /*�Զ���������*/ || (vPar.getBool('R_RedoObject') && value == '0' /*˫����������*/)) ||
                            (value == '2' /*˫�������Լ�*/ && sessionStorage.getItem('loginID') == vPar.getStr('R_RedoLoginID'))
                        ) {
                            showFlowObjConfirmR(vPar);
                        }
                        break;
                    }
            }
        }
    }
}

function msgForumOpt(vPar) {
    var arr = vPar.getStrList('MessageIDs');
    for (var i = 0; i < arr.length; i++) {
        if ($('.messageList #' + arr[i]).length != 0) {
            $('#msgView h').text(parseInt($('#msgView  h').text()) - 1);
        }
        $('.messageList #' + arr[i]).remove();
        if ($('.messageList .media').length == 0) {
            $('#msgView  h').addClass('hidden');
            $('.messageList .footer').addClass('hidden');
            $('.messageList .msg-empty').removeClass('hidden');
        }
    }
}

//ʵʱ���±�������״̬,�Ͽ�Serverʱ��ҳδˢ�£��жϱ����Ƿ�����
function tmStateTimer() {
    callServerFunc("TSystemDM", "GetBackupServer", new ParamArr(), function (vPar, sError) {
        lpfInitWindow2(vPar, sError);
        setTimeout('tmStateTimer()', 10000);
    });
}

var toastrTimer;
function lpfPushMessagesErrror(vPar, sError) {
    if (sError !== 'error') {
        if (sError !== 'timeout') {
            showPushMessageError(getENStr(sError), getENStr("����"));
            clearTimeout(toastrTimer);
            toastrTimer = setTimeout(function () {
                toastr.clear();
            }, 3000); 
        }
        mainMessages.postMessageToObjects(vPar);
        if (!mainIsOpenWebSocket) window.mainMessages.getMessages();
    }
}  

function lpfReconnect() {
    if (mainAgainTime < 60000)
        mainAgainTime += 10000;
    toastr.clear();
    showPushMessageError(getENStr("������������..."), getENStr("��ʾ"));
    callServerFunc("TBaseDM", "Test1", new ParamArr(), function (vPar, sError) {
        toastr.clear();
        if (sError == "") {
            //����̨�л�������,��ť�л�
            if (emergencymgr.getStr("Host") != '' && emergencymgr.getStr("Port") != '') {//�ж��Ƿ����ñ���
                if (emergencymgr.getBool("IsBack")) {//�����ڱ���ʱ
                    if (window.backupLinkToMainBySwithButton == 1) {//��ť�л�������
                        window.backupLinkToMainBySwithButton = '';
                        if (emergencymgr.getInt("State") > 0) {//�ж������Ƿ���
                            linkMainBackup(0);
                        } else {
                            if (energencyBackupNum == 0) {
                                energencyBackupNum == 1;
                                msgBox("����Serverδ����,�л���������");
                            }
                        }
                    }
                }
            }
            //�������ӳɹ�
            vPar.setMsgId(WM_IOCP_CONNECTED);
            mainMessages.postMessageToObjects(vPar, false);
            //��ȡ��Ϣ
            if (!mainIsOpenWebSocket) mainMessages.getMessages();
            return;
        } else {
            if (emergencymgr.getStr("Host") != '' && emergencymgr.getStr("Port") != '') {//�ж��Ƿ����ñ���
                //��������ʧ�ܺ����ӱ���
                if (emergencymgr.getBool("IsMain")) {//����������ʱ
                    if (emergencymgr.getInt("State") > 0) {//�жϱ���Server�Ƿ���
                        if (emergencymgr.getBool("Auto")) {//˫��������ѡ�Զ�����ʱ
                            linkMainBackup(1);
                        } else {
                            linkMainBackup(1);
                        }
                    } else {
                        if (energencyNum == 0) {
                            energencyNum = 1;
                            //msgBox("δ�����ӱ���Server,�л���������");
                        }
                    }
                }
                //��������ʧ�ܺ���������
                else if (emergencymgr.getBool("IsBack")) {//�����ڱ���ʱ
                    if (emergencymgr.getInt("State") > 0) {//�ж������Ƿ���
                        if (emergencymgr.getBool("Auto")) {//˫��������ѡ�Զ�����ʱ
                            linkMainBackup(0);
                        } else {
                            linkMainBackup(0);
                        }
                    } else {
                        if (energencyNum == 0) {
                            energencyNum = 1;
                            msgBox("����Serverδ����,�л���������");
                        }
                    }
                }
            }
        }
        showConnectError(vPar, sError);
    });
}

function linkMainBackup(num) {
    var str;
    if (num == 0) {
        str = "�Ƿ���������?";
    } else if (num == 1) {
        str = "��������ʧ���Ƿ����ӱ���?";
    } else if (num == 2) {
        str = "���������Ƿ���������?";

    }
    if (energencyCount == 0) {
        energencyCount = 1;
        msgYesNo(getENStr(str), [], function (result, params) {
            if (result) {
                window.location.href = "http://" + emergencymgr.getStr("Host") + ":" + emergencymgr.getStr("Port") + "/web/login.html?reset=11&deskey=" + backup.deskey + "&eds=" + backup.eds + "&user=" + backup.user + "&num=" + num;
            } else {
                energencyCount = 0;
                isCancel = true
                tipTimer = 0
            }
        });
    }
}

var lpfReconnectTimer;
function showConnectError(vPar, sError) {
    if (sError == "error")
        sError = "�����������������⡣";
    if (vPar.getBool("TokenError") == true) {
        showPushMessageError(getENStr(sError), getENStr("����"), function () {
            if (confirm(getENStr("�Ƿ�Ҫע��?"))) {
                $(window).unbind('beforeunload');
                window.location.href = "login.html";
            }
        });
        return;
    }
    showPushMessageError(getENStr(sError), getENStr("����"), undefined, {vPar});
    if (!mainIsOpenWebSocket) {
        if (mainAgainTime >= 30000) {
            clearTimeout(lpfReconnectTimer);
        }
        lpfReconnectTimer = setTimeout("lpfReconnect();", mainAgainTime);
    }
}

/*
* ******************************************** ��ʼ�� ****************************************
* *******************************************************************************************
*/
$(document).ready(function () {
    // û�����
    // if (!sessionStorage.getItem('MainUrlData'))
        // sessionStorage.setItem('MainUrlData', JSON.stringify(urlParam));
    // else
        // urlParam = JSON.parse(sessionStorage.getItem('MainUrlData'));
    // Token
    if (urlParam.token) {
        sessionStorage.setItem('Token', urlParam.token);
    } else if (urlParam.topage && !sessionStorage.getItem('Token') && localStorage.getItem('share_token')) {
        //topage ����ʹ�ã������ͬ��ҳ������share_token, ��ʹ�����token
        sessionStorage.setItem('Token', localStorage.getItem('share_token'))
    }
    //��Ʒ��url��ת
    if (getBrowserParamByName('productPath')) {
        productPath = '?productPath=' + getBrowserParamByName('productPath')
        if (sessionStorage.getItem('Token') == null)
            sessionStorage.setItem('productPath', getBrowserParamByName('productPath'))
    } else if (sessionStorage.getItem('productPath')) {
        productPath = '?productPath=' + sessionStorage.getItem('productPath')
        sessionStorage.removeItem('productPath')
    }


    if (getBrowserParamByName('type')) {
        productPath += '&type=' + getBrowserParamByName('type')
        if (sessionStorage.getItem('Token') == null)
            sessionStorage.setItem('type', getBrowserParamByName('type'))
    } else if (sessionStorage.getItem('type')) {
        productPath += '&type=' + sessionStorage.getItem('type')
        sessionStorage.removeItem('type')
    }
    //topage ��ָ���򿪲˵�����
    if (urlParam.topage) {
        localStorage.setItem('topage_data', JSON.stringify(urlParam))
        if(urlParam.save_url_param == 1) {
            localStorage.setItem('save_url_param', 1)
        } else {
            localStorage.setItem('save_url_param', 0)
        }
        if (urlParam.appname) {
            sessionStorage.setItem('token_app_name', urlParam.appname)
            sessionStorage.setItem('token_app_pass', urlParam.apppass)
        }
    }

    // ����
    if (urlParam.tbname || urlParam.topage) {
        callServerFunc('THttpDM', 'GetUserStyle', new ParamArr(), function (vPar, sError) {
            if (sError != '') return msgBox(sError);
            sessionStorage.setItem('user', vPar.getStr('UserID'));
            sessionStorage.setItem('username', vPar.getStr('UserName'));
            sessionStorage.setItem('style', vPar.getStr('Style'));
            sessionStorage.setItem('RPAUser', vPar.getInt('RPAUser') + '');
            if (vPar.getStr('Style') === '�����' && location.pathname === '/web/main.html') {
                location.href = location.href.replace('/web/main.html?', '/web/main_5.html?')
                return
            }
            initMainPage();
        });
    } else {
        initMainPage();
    }
    //�Ƿ������ⲿ������
    if(sessionStorage.getItem('ExternalRobot') == 'true'){
        var vPar = new ParamArr()
		vPar.setBool('Robot', true);//�ⲿ�����˲�������
		callServerFunc('TTestDM', 'GetExternalRobotVendorList', vPar, function (vPar, sError) { 
			if(sError != ''){
                return msgBox(sError)
            }
            var VendorList = vPar.getStr("VendorList").split(',')
            //�ⲿ����
            sessionStorage.setItem('ExternalRobotVendorList', vPar.getStr("VendorList"));
            for (var i = 0; i < VendorList.length; i++) {
                var vPar = new ParamArr()
                vPar.setStr('Vendor', VendorList[i])
                //�ⲿ�����Ƿ������ļ��й���
                callServerFunc('TTestDM', 'GetUiPathMultiFolderConfig', vPar, function (vPar, sError) {
                    if (sError != '') {
                        return msgBox(sError)
                    }
                    var config = {}
                    if(sessionStorage.getItem('UiPathMultiFolderConfig') != null){
                        config = JSON.parse(sessionStorage.getItem('UiPathMultiFolderConfig'))
                    }
                    config[vPar.getStr('Vendor')] = vPar.getBool('UiPathMultiFolder')
                    sessionStorage.setItem('UiPathMultiFolderConfig', JSON.stringify(config));
                })
            }
        })
    }
});

function initMainPage() {
    r = parseLocationSearch(decodeURIComponent(location.search));
    backup.deskey = sessionStorage.getItem("deskey");
    backup.eds = sessionStorage.getItem("eds");
    backup.user = sessionStorage.getItem("user");
    if ($.isEmptyObject(r)) return;
    if(sessionStorage.getItem('sysLogoIndex') == 66 || sessionStorage.getItem('sysLogoIndex') == 75){
        history.pushState(null, null, 'main_6.html' + productPath);
    }else if (sessionStorage.getItem('style') == '�����' && sessionStorage.getItem('isRPALogo') === 'true') {
        history.pushState(null, null, 'main_5.html' + productPath);
    } else {
        history.pushState(null, null, 'main.html' + productPath);
    }
    //��ʼ����С
    pageWidth();
    // ָ����ʾ
    if(urlParam.slefPage === 'true'){
        $('.navbar,#left,#myTab').hide()
        $('#center').css({width: '100%', 'padding': 0})
        $('#myTabContent,.tab-pane>iframe').css({'height': '100vh'})
    }
    // $('#left').height(window.innerHeight - 50);
    var userStr = strFormat('��ӭ����[{0}] {1}', sessionStorage.user, sessionStorage.username);
    if (sessionStorage.RPAUser == 1) {
        userStr = strFormat('��ӭ����{0}', sessionStorage.username);
    }
    $('.header-right .user').text(userStr); //��ӭ��
    //��ʼ������
    var lockInterval = setInterval(function () {
        if (!isCNLanguage && (mainLanguageObj === undefined || !mainLanguageObj.isReadFinish)) return;
        var id = 'unLockButton';
        lock.init(id);
        initUnlockButtonClick(id);
        if (sessionStorage.getItem('isLockPage') == 'lock') lock.onLock();
        clearInterval(lockInterval);
    }, 10);
    //��ʼ��ϵͳ����
    getSystemData([], function (data) {
        if(urlParam.topage){
            var msg = setInterval(function (){
                if(sessionStorage.getItem('share_token_1')){//������Ϣ������Ҫ�ȵ��ӿڷ��ص�token
                    initMainMessage();
                    clearInterval(msg)
                }
            }, 1000)
        } else {
            initMainMessage();
        }
        //��ʱ�䲻����ҳ�� ָ��ʱ�����ע����¼
        initCheckTimeOutAndLogout()
    });
    // ��ȡ����
    var vPar = new ParamArr();
    //���ŵ� ���������˵���ȡ
    if (sessionStorage.getItem('sysLogoIndex') == 31) {
        $('form.search,#miLock,#miUser').hide();
        vPar.setBool('WebPatch', true);
    }
    new Promise((res, ret) => {
        let vTmp = new ParamArr()
        vTmp.setStr('Group', 'webϵͳ����')
        callServerFunc('TSystemDM', 'GetConfigInfo', vTmp, (vPar, sError) => {
            if (sError) return msgBox(sError)
            var keys = getWebSystem(true)
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (vPar.has(key)) {
                    setWebSystem(key, vPar.getStr(key))
                }
            }
            res()
        })
    }).then(() => {
        if (getWebSystem('ʹ��vue����') == '1') {
            vPar.setBool('WebVue', true)
        }
        callServerFunc("THomeDM", "GetWebHome", vPar, lpfInitWindow);
        callServerFunc("TBigScreenDM", "GetBigScreenList", new ParamArr(), function (vPar, sError) {
            if (sError) return msgBox(sError)
            //����
            var table = new SQLTable(vPar.getTable("k_bigscreen_group"));
            var nodes = [];
            var nodeMap = new Map();
            table.first();
            while (!table.eof()) {
                var node = {};
                node["id"] = table.getValueByName("ID");
                node['pid'] = table.getValueByName("PID");
                var pnode = getTreeviewPNode(nodeMap, nodes, node.pid);
                pnode.push(node);
                nodeMap.set(node.id, node);
                table.next();
            }
            table = new SQLTable(vPar.getTable("k_bigscreen"));
            table.first();
            while (!table.eof()) {
                var node = {};
                node["id"] = table.getValueByName("ID");
                node['pid'] = table.getValueByName("PID");
                node['type']=0
                var pnode = getTreeviewPNode(nodeMap, nodes, node.pid);
                pnode.push(node);
                nodeMap.set(node.id, node);
                table.next();
            }
            getNodesId(nodes)
            function getNodesId(rows){
                for(var i =0;i<rows.length;i++){
                    if(rows[i].nodes){
                        getNodesId(rows[i].nodes)
                    }
                    if(rows[i]['type']==0){
                        screenIdArr.push(rows[i]['id'])
                    }
                }
            }

        })
    })
    //��ʱ��ȡ˫����������
    tmStateTimer();
}

// ˫������
function lpfInitWindow2(vPar, sError) {
    if (sError != "") return;
    emergencymgr = vPar;
    //��ѡ���������Զ�����
    if (vPar.getBool('swAgent') && vPar.getBool('IsBack') && sessionStorage.getItem('num') == 1) {
        if (vPar.getInt('State') == 2) // �������� ��������
        {
            if (tipTimer == 0 && !isCancel || tipTimer >= 10) linkMainBackup(2)
            if (isCancel) tipTimer++;
        }
    }
}

function lpfInitWindow(vPar, sError) {
    showStateMsg('���ڼ�������...');
    localStorage.setItem('share_token', vPar.getStr('Token'))
    sessionStorage.setItem('share_token_1', vPar.getStr('Token'))
    //ͬ��server�ȼ���ɫ
    initWebLevelColor(vPar);
    if (sError != '') {
        //�л�������ʱ��ת��¼ҳ
        //������Чreset����ʱ�Զ���¼��ҳ
        if (r.reset) {
            window.location.href = "login.html?reset=11" + "&deskey=" + sessionStorage.getItem("deskey") + "&eds=" + sessionStorage.getItem("eds") + "&user=" + sessionStorage.getItem("user");
        } else {
            alert(sError);
            window.location.href = "login.html";
        }
        return;
    }
    $("#miUser").data("LoginID", vPar.getStr("LoginID"));
    g_isRPA = vPar.getBool("RPA");// ���浱ǰ����
    // document.title = g_isRPA ? 'K-RPA' : vPar.getStr('SysLogo');
    //��ʼ��ϵͳ��������
    initSysInfo(vPar);
    if (vPar.getStr('SysLogo') == '��Ʒ��') {
        g_isProduct = true
        $('#miLock').hide()
    }
    if (sessionStorage.getItem('RPAUser') != 1) $('#left,#logoView,#mainSearch,#miSearch').removeClass('hidden');
    if (sessionStorage.getItem('RPAUser') == 1) $('#feedBack').removeClass('hidden');
    // Ĭ�����أ������涨�ƵĲ�����˸
    $('#mytop').removeClass('hidden');
    // ��������ͼ��ʽ
    if (urlParam.tbname == 'flowview') {
        $('#left,#logoView,#mainSearch,#miSearch,#mytop').remove();
        $('#center').css({ 'padding-top': '0px', 'width': '100%' });
        $('#myTabContent').css({ 'height': window.innerHeight - 35 + 'px' });
        $('#myTab').addClass('borderTop');
    }
    initLanguage(vPar); //���ط���ģ��
    mainTimer = setInterval(function () { initMainView(vPar) }, 0); //����ģ�������ִ�к���
    // mainMessages.getMessages();
    // �������keyʧЧ������
    setInterval(function(){
        callServerFunc("TBaseDM", "Test2", new ParamArr(), function(vPar, sError){
            sessionStorage.setItem('deskey', vPar.getStr("key"));
        });
    }, 1 * 60 * 1000);
    helpInfo = getSystemConfigByName('���ð�����Ϣ')
    var vlaueArr = helpInfo.value || ''
    var a = vlaueArr.replace(/}/g,'');
    var b = a.split('{');
    for (var i = 0; i < b.length; i++) {
        if (b[1] == 1) {
            $('#miHelpInfo').removeClass('hidden')
        } else {
            $('#miHelpInfo').remove()
        }
    }
    // ��ʾ����ִ�еĽ�������
    showWaitPro(vPar)
}
function showWaitPro(vPar) {
    var count = vPar.getInt('Count')
    var src = $("#myTabContent .active iframe").attr('src')

    for (let i = 0; i < count; i++) {
        var flowMap = flowExecIDMap.get(vPar.getStr('ExecID_' + i))
        if (vPar.getBool('bComponentBox_' + i)) {
            if (flowMap != undefined) {
                if (src.indexOf('&flowid=' + flowMap) == -1 || src.indexOf('funcs/flow/flowview.html') == -1) {
                    return
                }
            } else {
                if (src.indexOf('&execid=' + vPar.getStr('ExecID_' + i)) == -1) {
                    return
                }
            }
        }
        if (vPar.getBool("UserLogin_" + i)) {
            showWaitUserLogin(vPar.getStr('Caption_' + i), vPar.getStr('ID_' + i), undefined);
        } else {
            showWaitInput(
                vPar.getStr('Caption_' + i),
                vPar.getStr('Text_' + i),
                vPar.getStr('Char_' + i),
                vPar.getStr('ID_' + i),
                vPar.getFileToBlobUrl('Pic_' + i),
                vPar.getBool('IsPassword_' + i),
                undefined,
                vPar.getInt('Width_' + i),
                vPar.getInt('Height_' + i),
                vPar.getStr('Options_' + i)
            );
        }
    }

}
//ϵͳlogo����
function initSysInfo(vPar) {
    var sysLogo = vPar.getStr("SysLogo").toLowerCase();
    // rpa���� ������Ϣ�б�
    if (sysLogo == 'rpa����') {
        initMessageList();
    } else {
        $('#msgView').remove();
    }
    sessionStorage.setItem('sysLogo', sysLogo); //���浱ǰlogo
    var sysInfo = g_logoImgMain[sysLogo]
    if (sysInfo) {
        if (sysInfo.title) {
            $("title").html(sysInfo.title);
            $("#SysLogo").html(sysInfo.title);
        }
        if (sysInfo.logo) {
            $("#header-logo,#rpaLogo").attr('src', strFormat('{0}{1}', './img/logo/', sysInfo.logo))
        }
    }
    if(getWebSystem('��ҳlogo')){
        $("#SysLogo").html(getWebSystem('��ҳlogo'));
    }
    if(getWebSystem('��ҳ����')){
        $("title").html(getWebSystem('��ҳ����'))
    }

    $("#SysLogo,#header-logo,#rpaLogo").show();

    if(sysLogo == '����8¥' || sysLogo == '����7¥') {
        $("#SysLogo").hide()
        $("#header-logo").css({'margin-left':'-20px'})
    }
    if(sysLogo == '�㷢֤ȯ'){
        $("#SysLogo").hide()
        $("#header-logo").css({'margin-left':'-15px','padding-top':'5px','padding-bottom':'5px'})
    }
}
// ���ط���ģ��
function initLanguage(vPar) {
    if(urlParam.slefPage == 'true') return
    var g_languageStr = vPar.getStr('LanguageName');
    if (g_languageStr != '' && languageCorrespondingTable[g_languageStr]) {
        //�Ӷ�Ӧ�����ó��������Ӧ�� ��������
        g_language = languageCorrespondingTable[g_languageStr];
        //����ȫ�ֱ����Ƿ���
        isEnLang = true;
        //��ʼ������ģ��
        mainLanguageObj = new LanguageModule('./lib/aomjs/' + g_languageStr + '.json');
    } else {
        g_language = 'zh-CN';
        isCNLanguage = true;
    }
}
// ����ģ�������ִ�к���
function initMainView(vPar) {
    //josin�ļ�������ִ��
    if ((!isEnLang && !mainLanguageObj) || mainLanguageObj.isReadFinish) {
        if (mainTimer) clearInterval(mainTimer);
        userID = vPar.getStr("UserID");//�����û���Ϣ ����������֤����
        username = vPar.getStr("UserName");//�����û���Ϣ ����������֤����
        $("#Userid").text(vPar.getStr("UserID"));
        $("#Userid2").text(vPar.getStr("UserID"));
        $("#Username").text(vPar.getStr("UserName"));
        // ������ת����ͼ����
        if (urlParam.tbname == 'flowview') {
            var url = getTokenUrl('funcs/flow/flowview.html');
            url += strFormat("&viewtype={0}&flowid={1}&execid={2}&dbdate={3}", urlParam.viewtype, urlParam.flowid, urlParam.execid, urlParam.dbdate);
            mainPages.addTab(urlParam.execid, urlParam.flowname || '����', url);
            $('#myTab li').eq(0).find('.closeTab').remove();
            freeStateMsg();
            return;
        }
        //������ӪLogo ����Ҫ��ʼ�˵�ҳ��
        if(sessionStorage.getItem('sysLogoIndex') != 66){
            //��ӿհ�ҳ��
            mainPages.addTab('startPage', getENStr('��ʼ'), thatStyle() == '�����' ? getTokenUrl('startPage_5.html') : getTokenUrl('startPage.html'));
        }
        //���عرհ�ť
        $('#tab_li_' + 'startPage' + ' button').hide();
        // �˵�
        var ui_menu = $('#main-menu');
        g_menu_vPar = vPar;
        var myHomeInit; //������ҳ
        var homePageObj = {};
        var nodes = [];
        var nodeMap = new Map();
        var table = new SQLTable(vPar.getTable("k_menu"));
        table.first();
        while (!table.eof()) {
            var node = {};
            var index = table.dataRow;
            node['id'] = table.getValueByName('ID');
            node['pid'] = table.getValueByName('PID');
            node['url'] = table.getValueByName('url');
            node['count'] = table.getIntByName('Count');
            node['icon'] = table.getValueByName('icon');
            node['name'] = table.getValueByName('Title');
            node['aLevel'] = table.getIntByName('aLevel');
            if(node['name']=='�������'&&node['aLevel']==1){
                bigscreenbrowseId = node['id']
            }
            var pNode = nodeMap.get(node.pid);
            if (pNode) node['pName'] = pNode.name;
            if (node.aLevel == 2 && pNode) {
                node['pName'] = strFormat('{0} -> {1}', pNode.pName, pNode.name);
                nodes.push(node);
            }
            nodeMap.set(node.id, node);
            if (node.aLevel == 0) {
                var iRow = table.dataRow;
                var icon = strFormat('<img src="img/main/{0}.png" align=absmiddle />', node.icon || strFormat('menu{0}', ++iRow));
                var menuStr = '<li class="menu-item" id="{0}" onclick=showChildPage("{0}",this) title="" style="position: relative;"><div class="left_content">{2}{1}</div></li>';
                ui_menu.append(strFormat(menuStr, node.id, getMenuName(node.name), icon));
                // ����rpa���� or ������������ʾ
                if (thatStyle() != '�����') {
                    $('body').append(strFormat('<div id="li_{0}" class="showTitle" style="display:none">{1}</div>', node.id, getENStr(node.name)));
                }
            } else if (node.count == 0 && (node.name == '����̨' || node.name == '��ҳ')) {
                if(vPar.getStr('SysLogo') == '����֤ȯ'){
                    node.url = 'funcs/home/anxin_home.html'
                }
                //���ݺ�̨δ�ı�ṹ�ģ���ɾ
                var url = vPar.getBool('RPA') ? 'funcs/home/rpa_home.html' : node.url;
                homePageObj.id = node.id;
                homePageObj.title = getENStr(node.name);
                homePageObj.url = getTokenUrl(url);
            }
            if (vPar.getStr('SysLogo') == '������' && node.count == 0 && node.name == '����') {
                homePageObj.id = node.id;
                homePageObj.title = getENStr(node.name);
                homePageObj.url = getTokenUrl(node.url);
            }
            var tbname = node.url.substring(node.url.lastIndexOf('/') + 1, node.url.lastIndexOf('.'));
            if (node.aLevel == 2 && urlParam.tbname == tbname) {
                homePageObj.id = node.id;
                homePageObj.title = getENStr(node.name);
                homePageObj.url = getTokenUrl(node.url);
                homePageObj.isTbName = true;
            }
            // �������
            if (node.name == '�������') g_softpublishId = ('g_softpublishId', table.getValueByName("id")); //������������id;
            // ��Ʒ��
            if (node.name == '��Ʒ�����') mainPages.addTab(node.id, getENStr('��Ʒ�����'), getTokenUrl('funcs/products/productmgr.html'));
            // ��Ӫ
            if (node.name == '������ҳ') {
                var id = node.id;
                var url = node.url;
                var title = node.name;
                myHomeInit = function () {
                    $('#mainSearch').remove();
                    mainPages.addTab(id, title, url);
                    $(strFormat('#tab_li_{0} .close', id)).remove();
                };
            }
            table.next();
        }
        // ������
        $.typeahead({
            input: ".js-typeahead",
            minLength: 1,
            maxItem: 15,
            order: "asc",
            hint: true,
            group: {
                key: "pName",
                template: function (item) { return item.pName; }
            },
            display: ["name"],
            maxItemPerGroup: 5,
            emptyTemplate: 'û���ҵ� "{{query}}"',
            source: { data: nodes },
            callback: {
                onClickAfter: function (node, a, item, event) {
                    mainPages.addTab(item.id, item.name, getTokenUrl(item.url));
                    event.preventDefault();
                }
            }
        });
        //IE������߶�����
        $('#main-menu .left_content').css('margin-top', ("ActiveXObject" in window) ? '-30px' : '0px');
         //��ʼ��ҳ��򿪺��Զ���ָ��ҳ��
         if (urlParam.topage || (localStorage.getItem('topage_data') && localStorage.getItem('save_url_param') == 1)) {
            initToPage(nodes)
            freeStateMsg();
            return
        }
        //���� user�û�Ϊ1
        if (sessionStorage.getItem('RPAUser') == 1) {
            mainPagesClose(mainPages.sortPage[0]);
            mainPagesClose(mainPages.sortPage[0]);
            $('#center').width('100%');
            if (myHomeInit) myHomeInit();
            freeStateMsg();
        } else {
            //��ʼ����ҳ
            initHomePage(homePageObj);
        }
    }
}
// ��ʽ������ ������õ�
function getMenuName(str) {
    var dom = '<p class="text">{0}</p>';
    if (sessionStorage.getItem('sysLogo') === "������Ӫƽ̨") {
        return strFormat(dom, str);
    }
    else if (thatStyle() == '�����' || sessionStorage.getItem('sysLogo') == '������') {
        str = str.replace(/\s|(����)$/g, ''); //�ո���β�ǹ������ȡ
        if (str == '�Զ�����') return strFormat(dom, str.substring(2));
        if (str == '���Ѳ��') return strFormat(dom, str.substring(0, 2));
        return strFormat(dom, getENStr(str));
    } else {
        return strFormat('<span class="text" style="display:none">{0}</span>', getENStr(str));
    }
}
//��ʼ��ҳ����ҳ
function initHomePage(homePageObj) {
    //������һ�δ򿪹�ҳ�棬��ֱ����ʾ���һ�δ򿪵�ҳ�� ������ʾ��ҳ
    const lastPage = sessionStorage.getItem('main_page_last_open')
    if(lastPage){
        const page = JSON.parse(lastPage)
        mainPages.addTab(page.name, page.title, page.url)
        if(sessionStorage.getItem('sysLogoIndex') == 66 || sessionStorage.getItem('sysLogoIndex') == 75){
            initMainMenu();
            freeStateMsg()
        }
        return
    }

    var vPar = new ParamArr();
    showStateMsg('���ڼ���...');
    vPar.setBool('IsInitHome', true);
    callServerFunc('THomeDM', 'GetWebHomePage', vPar, function (vPar, sError) {
        freeStateMsg();
        if (sError) return msgBox(sError);
        var list = [];
        var myList = [];
        sessionStorage.setItem('loginID', vPar.has('LoginID') ? vPar.getStr('LoginID') : vPar.getStr('Group'));
        var table = new SQLTable(vPar.getTable('k_config_info'));
        table.first();
        while (!table.eof()) {
            var value = table.getValueByName('sValue');
            if (value.indexOf('.html') != -1) {
                if (vPar.getStr('LoginID') == table.getValueByName('sGroup')) {
                    myList.push(value); //�Լ���ֻ��һ��
                } else {
                    list.push(value);
                }
            }
            table.next();
        }
        if (myList.length != 0) {
            list = myList;
        }
        list = list.join(',');
        //���ݱ���� ��ʽΪ  {....}time  ���timeΪ��ҳ��ʱ����
        var index = list.lastIndexOf('}');
        var time = list.substring(index + 1) || 500;
        list = list.substring(0, index + 1);
        //��ȡ������ҳ����
        var arr = list == "" ? [] : list.split(',');
        //����
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i].substring(1, arr[i].length - 1).replace(/\}\{/g, ',');
            if (item == '') continue;
            item = item.split(',');
            addTab(item[0], item[2], item[1], i);
        }
        //����û�û��������ҳ����Ĭ����ʾ��ҳ
        if ((arr.length == 0 && !$.isEmptyObject(homePageObj)) || homePageObj.isTbName) {
            setTimeout(function () {
                mainPages.addTab(homePageObj.id, homePageObj.title, homePageObj.url);
            }, arr.length * time)
        }
        //��������첽����
        function addTab(id, title, url, i) {
            setTimeout(function () {
                mainPages.addTab(id, title, getTokenUrl(url));
            }, i * time)
        }
        if(sessionStorage.getItem('sysLogoIndex') == 66 || sessionStorage.getItem('sysLogoIndex') == 75){
            initMainMenu((arr.length == 0 && $.isEmptyObject(homePageObj)));
        }
    })
}
function initCheckTimeOutAndLogout(){
    if (!topWindow.g_isCheckTimeOutAndLogout) return;
    //���һ�β���ҳ���ʱ�䣬 �簴���������
    if (topWindow.g_optPageLastTime === undefined) {
        topWindow.g_optPageLastTime = new Date().getTime();
    }
    //����
    document.addEventListener('keydown', function () {
        topWindow.g_optPageLastTime = new Date().getTime();
    }, true);
    //��갴��
    document.addEventListener('mousedown', function () {
        topWindow.g_optPageLastTime = new Date().getTime();
    }, true);
    //������
    document.addEventListener('mousewheel', function () {
        topWindow.g_optPageLastTime = new Date().getTime();
    }, true);


    //������ʱ�䳬����ָ��ʱ�� ��ע��
    var time = 20 * 1000; //��ü��һ��
    var maxTime = 2 * 60 * 1000; //����������ʱ��
    //��ʱ����Ƿ�ʱ
    (function a() {
        maxTime = parseInt(getSystemConfigByName('���Ƴ�ʱ(����)').value || 30) * 60 * 1000;
        //�������ϴβ�����ʱ��
        var t = new Date().getTime() - topWindow.g_optPageLastTime;
        if (t > maxTime) {
            logoutToken();
        } else if ((maxTime - t) < 60000) {
            showTimeoutMsg();
        }
        setTimeout(a, time);
    })()

    function showTimeoutMsg() {
        var t0 = new Date().getTime();
        if ((t0 - (topWindow.g_lastTimeOutMsgTime || 0)) < 70000) return;
        topWindow.g_lastTimeOutMsgTime = t0;
        topWindow.msgBox(`��������ʱ�䲻������ϵͳ����60�����Զ�ע��`, {
            time: 60000
        });
    }
}
/**
 * @description ͬ��ϵͳ�ȼ���ɫ
 * @param {Object} vPar
*/
function initWebLevelColor(vPar) {
    var table = new SQLTable(vPar.getTable('k_environment'));
    table.first();
    while (!table.eof()) {
        var name = table.getValueByName('Name');
        var value = table.getValueByName('Value');
        var index = getLevelIndex(name.replace('�澯��ɫ', ''));
        systemLevelColor[index] = value;
        table.next();
    }
}

//�ϴε��һ���˵�ID
var lastPageId = '-1';
function showChildPage(id, that) {
    actTagPage('startPage');
    layer.closeAll();
    $('.menu-list .li-click').removeClass('li-click');
    $('.menu-list .li-checked-icon').remove();
    $(that).addClass('li-click');
    var sysLogo = sessionStorage.getItem('sysLogo') || '';
    if (sysLogo.toUpperCase() != 'RPA����' || sessionStorage.getItem('style') != '�����')
        $(that).append('<span class="li-checked-icon"></span>');
    //���Edge�������������
    if (userAgent.indexOf("Edge") > -1) compatibleEdge(true);
    lastPageId = id;
    //���ÿ�ʼҳ������ݳ�ʼ��
    $("#tab_content_startPage iframe")[0].contentWindow.initPage(id);
}

//�л���ǩҳ
function actTagPage(id) {
    if (id == 'last') {
        if (mainPages.sortPage.length > 0) {
            id = mainPages.sortPage[mainPages.sortPage.length - 2];
            $("#tab_a_" + id).click();
        }
    } else {
        $("#tab_a_" + id).click(); //�л�����ʼҳ��
    }
}

//��ȡmain�״μ����Ƿ����
function mainPageIsInitDone() {
    return !$(".be-loading").hasClass('be-loading-active');
}

/* 
 * ��ǰ���
 * true ΪĬ��
 */
function thatStyle() {
    var style = sessionStorage.getItem('style') || '';
    var sysLogoIndex = sessionStorage.getItem('sysLogoIndex');
    // 24�±�Ϊk-rpa���������������Ķ���Ĭ��
    if (sysLogoIndex == 24 && style == '�����') {
        return style;
    } else if (sysLogoIndex != 24) {
        return style;
    } else {
        return '';
    }
}
/*
* ******************************************** ���� ******************************************
* ********************************************************************************************
*/
$(function () {
    $(window).bind('beforeunload', function (e) {
        if (!mainPages.getModifys()) return;
        var confirmationMessage = getENStr('ȷ���뿪��ҳ��?');
        (e || window.event).returnValue = confirmationMessage;	// Gecko and Trident
        return confirmationMessage;								// Gecko and WebKit
    });
    $('#miLogout').click(function (e) {
        msgYesNo(["�Ƿ�Ҫע��?"], [], function (result, params) {
            if (!result) return;
            showStateMsg("����ִ�в���...");
            logoutToken();
        });
    });
    $("#miUser").click(function (e) {
        if ($('#SysLogo').text() == '��Ʒ�����ϵͳ' && userID != 'admin') {
            showSetUserPro($("#miUser").data("LoginID"), function (outParams) { });
        } else {
            showUserConfirm({}, function () {
                freeStateMsg();
                // �ɵ���
                // showSetUserPro($("#miUser").data("LoginID"), function (outParams) { });
                // �µ���
                showuserPros('�޸���Ա', { id: sessionStorage.loginID, type: 1 }, true, function () { });
            });
        }
    });
    $("#myTab").on("click", "li", function () {
        if($('#SysLogo').text() == '��Ʒ�����ϵͳ'){
           if($(this).find('span').text() !== '��Ʒ�����'){
            initUrlState('')
           }else{
            initUrlState(window.topWindow.productPath)
           }
        }
        mainPages.addSortPage($(this).attr("id").replace("tab_li_", ""));
    });
    //�л���С
    $('#menubtn').click(function () {
        if (toggole = !toggole) {
            $('.menu-list li .text').show();
            leftMenuState = true;
        } else {
            $('.menu-list li .text').hide();
            leftMenuState = false;
        }
        pageWidth(true);
    });
    //����
    $('#miLock').click(function () {
        lock.onLock();
    })
    // �û�������Ϣ
    $('#miHelpInfo').click(function () {
        var params = {
            id: helpInfo.id
        }
        showSetHelpInfo('�û�������Ϣ', params, function(){})
    })
});
function initUrlState(url) {
    if (sessionStorage.getItem('style') == '�����' && sessionStorage.getItem('isRPALogo') === 'true') {
        window.topWindow.history.pushState(null, null, 'main_5.html'+ url);
    } else {
        window.topWindow.history.pushState(null, null, 'main.html'+ url);
    }
}
//��������ť���¼�
function initUnlockButtonClick(id) {
    //����
    $('#' + id).click(function () {
        var passwd = lock.getPasswd();
        showStateMsg("���ڼ�������...");
        callServerFunc("TBaseDM", "Test2", new ParamArr(), function (vPar, sError) {
            freeStateMsg();
            if (sError != "") {
                alert(sError);
                return;
            }
            var key = vPar.getStr('key');
            showStateMsg("������֤����...");
            var vPar = new ParamArr();
            vPar.setStr("Pass", encryptByDES(hex_md5(passwd), key));
            vPar.setStr("PassDES", encryptByDES(passwd, key));
            callServerFunc("TUserDM", "WebUserVerify", vPar, function (vPar, sError) {
                freeStateMsg();
                if (sError == "") {
                    lock.unLock();
                    pageWidth();
                }
                else {
                    lock.onPassError();
                }
            });
        });
    })
}
/* 
 * ��ʼ����С �趨����Ĭ�ϵ�
 * ���������Ҫ�Լ���д!!!!!!!!!!!!
 * isFirst �Ƿ�Ϊ��һ�� ��Ϊ���޸������л�����
 */
function pageWidth(isFirst) {
    var leftWidth = toggole ? leftMaxWidth : leftMixWidth;
    var bodyWidth = $('body').width();
    $("#left").width(leftWidth / bodyWidth * 100 + '%')
    $('#center').width((1 - leftWidth / bodyWidth) * 100 + '%')
    var h = window.innerHeight - $('#mytop').outerHeight();
    // $('#left').height(h);
    $('#myTabContent').height(window.innerHeight - $('#mytop').height() - 40/** #myTab�� �տ�ʼ�޷���ȡֱ��д�� **/ + 1/** #centerֻpingding-top 49 ���Զ���1PX **/);
}

/*
* ************************************* ���������������� *************************************
* *********************************************************************************************
*/
var userAgent = navigator.userAgent; //ȡ���������userAgent�ַ���
//���Edge��ʼҳ�����쳣����   isFirst ��Ϊ���޸������л�����
function compatibleEdge(isFirst) {
    toggole = !toggole;
    pageWidth(isFirst);
    toggole = !toggole;
    pageWidth(isFirst);
}

//���³�ʼ����ʼҳ��ĸ߶�
function setStartPageHeight() {
    var h = '100%';
    var isHide = $('#tab_content_startPage').is(':hidden');
    var activeTab = $('#myTab>.active>a');
    if (isHide) {
        h = window.innerHeight - $('#mytop').height() - $('#myTab').height() + 1/** #centerֻpingding-top 49 ���Զ���1PX **/ + 'px';
    }
    $('#tab_content_startPage iframe').removeAttr('height').css('height', h);
    var w = $('#tab_content_startPage iframe')[0];
    isStartPageFinsh = false;
    if (w) w.contentWindow.history.go(0);
    var t = setInterval(function () {
        if (!isStartPageFinsh) return;
        var sMenu = $('#left .li-click').removeClass('li-click');
        lastPageId = '';
        sMenu.click();
        activeTab.click();
        clearInterval(t);
    }, 50);

}
/* 
 * ��ȡurl��ַ��ֵ mainר��
 */
function getMainUrlParam() {
    var result = {};
    //�ָ��ַ���
    var strs = location.search.substring(1).split("&");
    //���������е�ÿһ��Ԫ��
    for (var i = 0; i < strs.length; i++) {
        var keyvalue = strs[i].split("=");
        var key = keyvalue[0];
        var value = keyvalue[1];
        result[key] = value;
    }
    return result;
}
// ������Ӫ������Ϣ
function initMessageList() {
    callServerFunc('TRPADM', 'RPAGetFeedBackMessage', new ParamArr(), function (vPar, sError) {
        if (sError != '') return msgBox(sError);
        var table = new SQLTable(vPar.getTable('k_message_list'));
        var user = new SQLTable(vPar.getTable('k_username'));
        if (table.rowCount == 0) {
            $('.msg-empty').removeClass('hidden');
        } else {
            $('.footer').removeClass('hidden');
            $('#msgView  h').removeClass('hidden').text(table.rowCount);
        }
        table.first();
        while (!table.eof()) {
            var icon, tid, hid, cont, name;
            var type = table.getValueByName('Type');
            if (user.locate('ID', [table.getValueByName('MessageFrom')])) {
                name = user.getValueByName('UserName');
            }
            if (type == '6') {
                icon = 'iconxinwen';
                cont = strFormat('{0}�������µķ���', name);
                tid = table.getValueByName('Content');
            } else if (type == '7') {
                icon = 'iconxiaoxi1';
                cont = strFormat('{0}�ظ�����ķ���', name);
                hid = table.getValueByName('Content');
                tid = table.getValueByName('FeedBackID');
            }
            var str = '<div class="media" id="' + table.getValueByName('MessageID') + '" tid="' + tid + '" hid="' + hid + '">' +
                '<div class="media-left">' +
                '<svg class="icon-svg" aria-hidden="true">' +
                '<use xlink:href="#' + icon + '"></use>' +
                '</svg>' +
                '</div>' +
                '<div class="media-body">' +
                '<div class="media-heading">' + cont + '</div>' +
                '<div class="media-bodying">' + table.getValueByName('Time') + '</div>' +
                '</div>' +
                '</div>';
            $('.messageList .list').append(str);
            table.next();
        }
    });
}

/**
 *          ����ҳ����غ��ָ���˵� 
 * ����url 127.0.0.1:80/web/main.html?topage=flowview&flowid=
 * 
 * ������ת����ģʽƴ������ʾ��Ϊ����ͼ  ?topage=flowview&flowid=
 * ���������ת ?topage=script
 * ����༭��ת ?topage=scripteditor&scriptid=
 * 
 * �����token �����ں����&token=
 * ���ʹ�� �û����� ���ں���� appname=xx&apppass=xx
 */
function initToPage(menus) {
    var res = '[��תҳ��]'
    var getUrlName = (url) => {
        var keys = Object.keys(AOM_MENU_JSON_MAP)
        for (let i = 0; i < keys.length; i++) {
            const element = keys[i];
            if (AOM_MENU_JSON_MAP[keys[i]] === url) {
                res = keys[i]
            }
        }
        return res
    }
    var data = localStorage.getItem('topage_data')
    // localStorage.removeItem('topage_data')
    var params = data ? JSON.parse(data) : urlParam
    var url = params.topage
    var hasAuto = false
    if (url === 'script') {
        url = 'script/script'
    }
    if (['flowview', 'scripteditor'].indexOf(url) !== -1) {
        hasAuto = true
    }
    for (let i = 0; i < menus.length; i++) {
        if(hasAuto) break
        if (menus[i].url.indexOf(`funcs/${url}.html`) === 0) {
            hasAuto = true
        }
    }
    if (!hasAuto) {
        return msgBox('û�иò˵�Ȩ��');
    }
    //����ͼ����
    if (url === 'flowview' || url === 'flow/flowview') {
        var url = getTokenUrl('funcs/flow/flowview.html');
        var FsBeginDate = formatDateTime('yyyy-MM-dd', new Date())
        if(params.begintime){
            var date = params.begintime.substring(0, 4) + '-' + params.begintime.substring(4, 6) + '-' + params.begintime.substring(6, 8)
            FsBeginDate = formatDateTime('yyyy-MM-dd', new Date(date))
        }
        var FsEndDate = formatDateTime('yyyy-MM-dd', new Date())
        getFlowDetail(FsBeginDate, FsEndDate, params, function (row) {
            var dbdate = params.dbdate
            var execid = params.execid
            !params.viewtype && (params.viewtype = 'view')
            if (row) {
                row.ExecState == -1 && (params.viewtype = 'task')
                dbdate = row.BeginTime.replace(/-/g, '').trim().replace(/:/g, '').replace(/\s*/g, '').substring(0, 8)
                execid = row.ExecID
            }

            var vueUrl = AOM_VUE_PATH_DATA['funcs/flow/flowview.html']
            if (getWebSystem('�Ƿ�����vue') == 1 && vueUrl) {
                mainPagesOpenVue(execid || params.flowid, params.flowname || '', vueUrl, {
                    flowId: params.flowid,
                    viewType: params.viewtype,
                    toObjId: params.objid,
                    execId: execid,
                    DBDate: dbdate
                })
            } else {
                url += strFormat("&viewtype={0}&flowid={1}&execid={2}&dbdate={3}", params.viewtype, params.flowid, execid, dbdate)
                params.objid && (url += `&objid=${params.objid}`)
                mainPages.addTab(params.execid || params.flowid, params.flowname || '����', url);
            }
        })
                
    }
    else if (url === 'script' || url === 'script/script') {
        var url = getTokenUrl('funcs/script/script.html');
        mainPages.addTab(MD5('�������') ,'�������', url);
    }
    else if (url === 'scripteditor' || url === 'script/scripteditor') {
        var vueUrl = AOM_VUE_PATH_DATA['funcs/script/scripteditor.html']
        if (getWebSystem('�Ƿ�����vue') == 1 && vueUrl) {
            mainPagesOpenVue(params.scriptid, '', vueUrl, {
                scriptid: params.scriptid,
                version: 2147483647,
                iseditor: params.iseditor
            })
        } else {
            var url = getTokenUrl('funcs/script/scripteditor.html');
            url += `&scriptid=${params.scriptid}&version=2147483647&iseditor=${params.iseditor}`
            mainPages.addTab(params.scriptid, '', url);
        }
    } else {
        url = `funcs/${url}.html`
        mainPages.addTab(MD5(params.topage) , getUrlName(params.topage), url);
    }
}
function getFlowDetail(FsBeginDate, FsEndDate, params, callback) {
    var vPar = new ParamArr();
    vPar.setStr('Type', '');
    vPar.setStr('User', '');
    vPar.setStr('Remark', '');
    vPar.setBool('Checked', false);
    vPar.setStr('FlowName', '');
    vPar.setStr('ClassName', '');
    vPar.setBool('ToPage', true);
    vPar.setFloat("StartDate", strToDateDef(FsBeginDate, getDate()));
    vPar.setFloat("EndDate", strToDateDef(FsEndDate, getDate()));
    callServerFunc("TFlowDM", "GetWebFlowDetailList", vPar, function (vPar, sError) {
        if (sError != "") {
            msgBox(sError);
            return;
        }
        var rows = []
        var table = new SQLTable(vPar.getTable("k_flow"));
        table.first();
        while (!table.eof()) {
            var row = {};
            row["ExecID"] = table.getValueByName("ID");
            row["TaskID"] = table.getValueByName("TaskID");
            row["FlowID"] = table.getValueByName("FlowID");
            row["DBDate"] = table.getValueByName("DataBaseName");
            row["ExecState"] = table.getIntByName("ExecState");
            row["Type"] = table.getIntByName("Type");
            if(row["Type"] == '2'){
                row["Vendor"] = table.getValueByName("Vendor");
                row["FloderID"] = table.getValueByName("FloderID");
                row["Key"] = table.getIntByName("Key");
            }
            // view
            row["FlowName"] = table.getValueByName("FlowName");
            row["Version"] = table.getValueByName("Version");
            row["ExceType"] = table.getValueByName("ExceType");
            row["BeginTime"] = table.getValueByName("BeginTime");
            row["EndTime"] = table.getValueByName("EndTime");
            row["ExecTime"] = table.getValueByName("ExecTime");
            row["User"] = strFormat("[{0}] {1}", table.getValueByName("UserID"), table.getValueByName("UserName"));
            row["Work"] = table.getValueByName("BusinessNo");
            row["ip"] = '-';
            row["InitFlag"] = table.getIntByName("InitFlag");
            if (row["ExecState"] == 1) {
                row["Remark"] = table.getValueByName("Remark");
            } else if (row["ExecState"] == -1) {
                if (table.getIntByName("InitFlag") > 0){
                    row["Remark"] = getENStr("���ڽ���[�ڵ��쳣]");
                }
                else{
                    row["Remark"] = getENStr("���ڽ���");
                }
            } else {
                row["Remark"] = table.getValueByName("Remark");
            }

            if(params.flowid == row.FlowID) {
                rows.push(row)
            }

            // next
            table.next();
        }
        if(rows.length > 0) {
            if(params.begintime) {
                var date = params.begintime.substring(0, 14)
                date = date.substr(0, 4) +'-'+ date.substr(4, 2) +'-' + date.substr(6, 2) + ' ' + date.substr(8, 2) + ':' + date.substr(10, 2) + ':' + date.substr(12, 2)
                var list = []
                for(var i in rows) {
                    var start = new Date(Date.parse(date));
                    var end = new Date(Date.parse(rows[i].BeginTime));
                    if(start >= end) {
                        list.push(rows[i])
                        break
                    }
                }
                if(list.length > 0){
                    callback(list[0])
                } else {
                    return msgBox(date +'����֮ǰ����δִ��')
                }
            } else {
                callback(rows[0])
            }
        } else {
            return msgBox('δ�ܲ��ҵ������̵�ִ�м�¼')
            // callback('')
        }
    });
}