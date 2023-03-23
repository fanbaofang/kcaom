/* 
 * main页面共用js
 * thatStyle() 区分风格，直接返回字符串，为空默认风格
 * 一些共用方法在html中重写一遍即可，main_5有案例
 * 2020-10-12
 * 更新脚本
 */

/*
* ******************************************** 全局变量 ***************************************
* *******************************************************************************************
*/
var mainPages = new TabPage("myTab", "myTabContent");
var mainDialogs = new Dialogs();
var mainMessages;
var mainSocketObj;
var mainIsOpenWebSocket = false;
var mainAgainTime = 5000;   // 重新连接时间
var userID = '';
var username = '';
var g_softpublishId = '';
var lock = new LockPage();
var g_eventUrlData = null;
var isCNLanguage = false;//是否为中文
var isStartPageFinsh; //开始页面加载是否完成
var toggole = false;  //false ->小   true ->大
var leftMaxWidth = 150; //大
var leftMixWidth = 50;  //小
var g_isProduct = false;
var mainTimer = null;
var urlParam = getMainUrlParam(); //记录url带过来的值
var helpInfo = '' // 用户帮助信息权限

//保存所有的系统设置项
var g_systemConfig = new Map();
topWindow = window
//记录浏览器启动的流程，用于判断交互函数是否弹出
var flowExecIDMap = new Map();
var screenIdArr = [];
var bigscreenbrowseId = ''
//监听屏幕大小改变
window.onresize = function () {
    if (sessionStorage.getItem('RPAUser') == 1 || urlParam.slefPage == 'true') return;
    pageWidth(true);
}

/*
* ******************************************** 双机互备 ***************************************
* *******************************************************************************************
*/
var emergencymgr, energencyCount = 0, energencyNum = 0;
var isCancel = false, tipTimer = 0//延迟时间
var backup = {};
var r;
var productPath = ''//url跳转
var energencyBackupNum = 0;//"未打开主机Server"弹框数量控制
window.backupLinkToMainBySwithButton = '';//双机互备全局变量,在备机时,断线重连为按钮切换时,为1。解决其他断线重连，弹出错误弹框的问题

/*
* **************************************** 消息推送 ******************************************
* ********************************************************************************************
*/

function initMainMessage() {
    mainIsOpenWebSocket = getSystemConfigByName('网页WebSocket推送').value == 1;
    mainMessages = new CPushMessages(lpfPushMessagesErrror, {
        mainIsOpenWebSocket: mainIsOpenWebSocket,
        isMainMsg: true
    });
    if (mainIsOpenWebSocket) {
        mainSocketObj = new CreateWebSocket();
    } else {
        mainMessages.getMessages();
    }

    //注册主页面的消息推送
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
    // 桌面助手禁用web消息弹窗
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
                case WM_BACKUP_SERVER: {//设置双机互备地址时
                    //获取双机互备数据，解决首次配置页面后断开Server，地址为空问题。
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
                        // 判断当前用户是否有权限接收
                        index = vPar.getStrList('MessageTo').indexOf(sessionStorage.getItem('user'));
                        if (vPar.has('MessageTo') && index != -1) {
                            var cont, icon;
                            if (vPar.getInt('MessageType') == 6) {// 新建
                                cont = strFormat('{0}创建了新的反馈', vPar.getStr('MessageFrom'));
                                icon = 'iconxinwen';
                            }
                            if (vPar.getInt('MessageType') == 7) {//回复
                                cont = strFormat('{0}回复了你的反馈', vPar.getStr('MessageFrom'));
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
                case WM_FLOW_CONFIRMOBJ: //流程节点确认
                    {
                        var user = sessionStorage.getItem('user');
                        //判断当前用户是否应该弹出窗口
                        var confirmIds = vPar.getStr('ConfirmUserID') || '';
                        if (confirmIds.indexOf(strFormat("'{0}'", user)) == -1) return;
                        //获取当前确认规则配置
                        var str = getSystemConfigByName('流程确认节点配置').value;
                        var value = 1; //默认值
                        if (/^\{\d\}/.test(str)) {
                            value = str.substring(1, 2);
                        }
                        if (!(vPar.getStr('User') && vPar.getStr('Pass')) && !vPar.getBool('OpenFlow') /*仅打开流程时弹出*/ &&
                            (value == '1' /*自动弹出所有*/ || (vPar.getBool('R_RedoObject') && value == '0' /*双击单出所有*/)) ||
                            (value == '2' /*双击弹出自己*/ && sessionStorage.getItem('loginID') == vPar.getStr('R_RedoLoginID'))
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

//实时更新备机连接状态,断开Server时主页未刷新，判断备机是否在线
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
            showPushMessageError(getENStr(sError), getENStr("错误"));
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
    showPushMessageError(getENStr("正在重新连接..."), getENStr("提示"));
    callServerFunc("TBaseDM", "Test1", new ParamArr(), function (vPar, sError) {
        toastr.clear();
        if (sError == "") {
            //控制台切换回主机,按钮切换
            if (emergencymgr.getStr("Host") != '' && emergencymgr.getStr("Port") != '') {//判断是否配置备机
                if (emergencymgr.getBool("IsBack")) {//连接在备机时
                    if (window.backupLinkToMainBySwithButton == 1) {//按钮切换到主机
                        window.backupLinkToMainBySwithButton = '';
                        if (emergencymgr.getInt("State") > 0) {//判断主机是否开启
                            linkMainBackup(0);
                        } else {
                            if (energencyBackupNum == 0) {
                                energencyBackupNum == 1;
                                msgBox("主机Server未开启,切换不到主机");
                            }
                        }
                    }
                }
            }
            //重新连接成功
            vPar.setMsgId(WM_IOCP_CONNECTED);
            mainMessages.postMessageToObjects(vPar, false);
            //获取消息
            if (!mainIsOpenWebSocket) mainMessages.getMessages();
            return;
        } else {
            if (emergencymgr.getStr("Host") != '' && emergencymgr.getStr("Port") != '') {//判断是否配置备机
                //主机连接失败后连接备机
                if (emergencymgr.getBool("IsMain")) {//连接在主机时
                    if (emergencymgr.getInt("State") > 0) {//判断备机Server是否开启
                        if (emergencymgr.getBool("Auto")) {//双机互备勾选自动连接时
                            linkMainBackup(1);
                        } else {
                            linkMainBackup(1);
                        }
                    } else {
                        if (energencyNum == 0) {
                            energencyNum = 1;
                            //msgBox("未打开连接备机Server,切换不到备机");
                        }
                    }
                }
                //备机连接失败后连接主机
                else if (emergencymgr.getBool("IsBack")) {//连接在备机时
                    if (emergencymgr.getInt("State") > 0) {//判断主机是否开启
                        if (emergencymgr.getBool("Auto")) {//双机互备勾选自动连接时
                            linkMainBackup(0);
                        } else {
                            linkMainBackup(0);
                        }
                    } else {
                        if (energencyNum == 0) {
                            energencyNum = 1;
                            msgBox("主机Server未开启,切换不到主机");
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
        str = "是否连接主机?";
    } else if (num == 1) {
        str = "主机连接失败是否连接备机?";
    } else if (num == 2) {
        str = "主机上线是否连接主机?";

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
        sError = "您的网络连接有问题。";
    if (vPar.getBool("TokenError") == true) {
        showPushMessageError(getENStr(sError), getENStr("错误"), function () {
            if (confirm(getENStr("是否要注销?"))) {
                $(window).unbind('beforeunload');
                window.location.href = "login.html";
            }
        });
        return;
    }
    showPushMessageError(getENStr(sError), getENStr("错误"), undefined, {vPar});
    if (!mainIsOpenWebSocket) {
        if (mainAgainTime >= 30000) {
            clearTimeout(lpfReconnectTimer);
        }
        lpfReconnectTimer = setTimeout("lpfReconnect();", mainAgainTime);
    }
}

/*
* ******************************************** 初始化 ****************************************
* *******************************************************************************************
*/
$(document).ready(function () {
    // 没有则存
    // if (!sessionStorage.getItem('MainUrlData'))
        // sessionStorage.setItem('MainUrlData', JSON.stringify(urlParam));
    // else
        // urlParam = JSON.parse(sessionStorage.getItem('MainUrlData'));
    // Token
    if (urlParam.token) {
        sessionStorage.setItem('Token', urlParam.token);
    } else if (urlParam.topage && !sessionStorage.getItem('Token') && localStorage.getItem('share_token')) {
        //topage 定制使用，如果相同的页面下有share_token, 则使用这个token
        sessionStorage.setItem('Token', localStorage.getItem('share_token'))
    }
    //制品库url跳转
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
    //topage ，指定打开菜单定制
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

    // 访问
    if (urlParam.tbname || urlParam.topage) {
        callServerFunc('THttpDM', 'GetUserStyle', new ParamArr(), function (vPar, sError) {
            if (sError != '') return msgBox(sError);
            sessionStorage.setItem('user', vPar.getStr('UserID'));
            sessionStorage.setItem('username', vPar.getStr('UserName'));
            sessionStorage.setItem('style', vPar.getStr('Style'));
            sessionStorage.setItem('RPAUser', vPar.getInt('RPAUser') + '');
            if (vPar.getStr('Style') === '风格五' && location.pathname === '/web/main.html') {
                location.href = location.href.replace('/web/main.html?', '/web/main_5.html?')
                return
            }
            initMainPage();
        });
    } else {
        initMainPage();
    }
    //是否启用外部机器人
    if(sessionStorage.getItem('ExternalRobot') == 'true'){
        var vPar = new ParamArr()
		vPar.setBool('Robot', true);//外部机器人操作处理
		callServerFunc('TTestDM', 'GetExternalRobotVendorList', vPar, function (vPar, sError) { 
			if(sError != ''){
                return msgBox(sError)
            }
            var VendorList = vPar.getStr("VendorList").split(',')
            //外部厂商
            sessionStorage.setItem('ExternalRobotVendorList', vPar.getStr("VendorList"));
            for (var i = 0; i < VendorList.length; i++) {
                var vPar = new ParamArr()
                vPar.setStr('Vendor', VendorList[i])
                //外部厂商是否启用文件夹管理
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
    }else if (sessionStorage.getItem('style') == '风格五' && sessionStorage.getItem('isRPALogo') === 'true') {
        history.pushState(null, null, 'main_5.html' + productPath);
    } else {
        history.pushState(null, null, 'main.html' + productPath);
    }
    //初始化大小
    pageWidth();
    // 指定显示
    if(urlParam.slefPage === 'true'){
        $('.navbar,#left,#myTab').hide()
        $('#center').css({width: '100%', 'padding': 0})
        $('#myTabContent,.tab-pane>iframe').css({'height': '100vh'})
    }
    // $('#left').height(window.innerHeight - 50);
    var userStr = strFormat('欢迎您，[{0}] {1}', sessionStorage.user, sessionStorage.username);
    if (sessionStorage.RPAUser == 1) {
        userStr = strFormat('欢迎您，{0}', sessionStorage.username);
    }
    $('.header-right .user').text(userStr); //欢迎语
    //初始化锁屏
    var lockInterval = setInterval(function () {
        if (!isCNLanguage && (mainLanguageObj === undefined || !mainLanguageObj.isReadFinish)) return;
        var id = 'unLockButton';
        lock.init(id);
        initUnlockButtonClick(id);
        if (sessionStorage.getItem('isLockPage') == 'lock') lock.onLock();
        clearInterval(lockInterval);
    }, 10);
    //初始化系统设置
    getSystemData([], function (data) {
        if(urlParam.topage){
            var msg = setInterval(function (){
                if(sessionStorage.getItem('share_token_1')){//令牌消息推送需要等到接口返回的token
                    initMainMessage();
                    clearInterval(msg)
                }
            }, 1000)
        } else {
            initMainMessage();
        }
        //长时间不操作页面 指定时间进行注销登录
        initCheckTimeOutAndLogout()
    });
    // 获取数据
    var vPar = new ParamArr();
    //国信的 机器补丁菜单获取
    if (sessionStorage.getItem('sysLogoIndex') == 31) {
        $('form.search,#miLock,#miUser').hide();
        vPar.setBool('WebPatch', true);
    }
    new Promise((res, ret) => {
        let vTmp = new ParamArr()
        vTmp.setStr('Group', 'web系统设置')
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
        if (getWebSystem('使用vue大屏') == '1') {
            vPar.setBool('WebVue', true)
        }
        callServerFunc("THomeDM", "GetWebHome", vPar, lpfInitWindow);
        callServerFunc("TBigScreenDM", "GetBigScreenList", new ParamArr(), function (vPar, sError) {
            if (sError) return msgBox(sError)
            //分组
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
    //定时获取双机互备数据
    tmStateTimer();
}

// 双机互备
function lpfInitWindow2(vPar, sError) {
    if (sError != "") return;
    emergencymgr = vPar;
    //勾选主机在线自动连接
    if (vPar.getBool('swAgent') && vPar.getBool('IsBack') && sessionStorage.getItem('num') == 1) {
        if (vPar.getInt('State') == 2) // 主机上线 重连主机
        {
            if (tipTimer == 0 && !isCancel || tipTimer >= 10) linkMainBackup(2)
            if (isCancel) tipTimer++;
        }
    }
}

function lpfInitWindow(vPar, sError) {
    showStateMsg('正在加载数据...');
    localStorage.setItem('share_token', vPar.getStr('Token'))
    sessionStorage.setItem('share_token_1', vPar.getStr('Token'))
    //同步server等级颜色
    initWebLevelColor(vPar);
    if (sError != '') {
        //切换主备机时跳转登录页
        //令牌无效reset存在时自动登录网页
        if (r.reset) {
            window.location.href = "login.html?reset=11" + "&deskey=" + sessionStorage.getItem("deskey") + "&eds=" + sessionStorage.getItem("eds") + "&user=" + sessionStorage.getItem("user");
        } else {
            alert(sError);
            window.location.href = "login.html";
        }
        return;
    }
    $("#miUser").data("LoginID", vPar.getStr("LoginID"));
    g_isRPA = vPar.getBool("RPA");// 保存当前环境
    // document.title = g_isRPA ? 'K-RPA' : vPar.getStr('SysLogo');
    //初始化系统详情内容
    initSysInfo(vPar);
    if (vPar.getStr('SysLogo') == '制品库') {
        g_isProduct = true
        $('#miLock').hide()
    }
    if (sessionStorage.getItem('RPAUser') != 1) $('#left,#logoView,#mainSearch,#miSearch').removeClass('hidden');
    if (sessionStorage.getItem('RPAUser') == 1) $('#feedBack').removeClass('hidden');
    // 默认隐藏，让下面定制的不会闪烁
    $('#mytop').removeClass('hidden');
    // 定制流程图样式
    if (urlParam.tbname == 'flowview') {
        $('#left,#logoView,#mainSearch,#miSearch,#mytop').remove();
        $('#center').css({ 'padding-top': '0px', 'width': '100%' });
        $('#myTabContent').css({ 'height': window.innerHeight - 35 + 'px' });
        $('#myTab').addClass('borderTop');
    }
    initLanguage(vPar); //加载翻译模块
    mainTimer = setInterval(function () { initMainView(vPar) }, 0); //翻译模块加载完执行函数
    // mainMessages.getMessages();
    // 解决密码key失效的问题
    setInterval(function(){
        callServerFunc("TBaseDM", "Test2", new ParamArr(), function(vPar, sError){
            sessionStorage.setItem('deskey', vPar.getStr("key"));
        });
    }, 1 * 60 * 1000);
    helpInfo = getSystemConfigByName('设置帮助信息')
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
    // 显示正在执行的交互函数
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
//系统logo标题
function initSysInfo(vPar) {
    var sysLogo = vPar.getStr("SysLogo").toLowerCase();
    // rpa社区 加载消息列表
    if (sysLogo == 'rpa社区') {
        initMessageList();
    } else {
        $('#msgView').remove();
    }
    sessionStorage.setItem('sysLogo', sysLogo); //保存当前logo
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
    if(getWebSystem('网页logo')){
        $("#SysLogo").html(getWebSystem('网页logo'));
    }
    if(getWebSystem('网页标题')){
        $("title").html(getWebSystem('网页标题'))
    }

    $("#SysLogo,#header-logo,#rpaLogo").show();

    if(sysLogo == '中信8楼' || sysLogo == '中信7楼') {
        $("#SysLogo").hide()
        $("#header-logo").css({'margin-left':'-20px'})
    }
    if(sysLogo == '广发证券'){
        $("#SysLogo").hide()
        $("#header-logo").css({'margin-left':'-15px','padding-top':'5px','padding-bottom':'5px'})
    }
}
// 加载翻译模块
function initLanguage(vPar) {
    if(urlParam.slefPage == 'true') return
    var g_languageStr = vPar.getStr('LanguageName');
    if (g_languageStr != '' && languageCorrespondingTable[g_languageStr]) {
        //从对应表里拿出来插件对应的 语言设置
        g_language = languageCorrespondingTable[g_languageStr];
        //设置全局变量是否翻译
        isEnLang = true;
        //初始化翻译模块
        mainLanguageObj = new LanguageModule('./lib/aomjs/' + g_languageStr + '.json');
    } else {
        g_language = 'zh-CN';
        isCNLanguage = true;
    }
}
// 翻译模块加载完执行函数
function initMainView(vPar) {
    //josin文件加载完执行
    if ((!isEnLang && !mainLanguageObj) || mainLanguageObj.isReadFinish) {
        if (mainTimer) clearInterval(mainTimer);
        userID = vPar.getStr("UserID");//保存用户信息 用于锁屏验证密码
        username = vPar.getStr("UserName");//保存用户信息 用于锁屏验证密码
        $("#Userid").text(vPar.getStr("UserID"));
        $("#Userid2").text(vPar.getStr("UserID"));
        $("#Username").text(vPar.getStr("UserName"));
        // 链接跳转流程图处理
        if (urlParam.tbname == 'flowview') {
            var url = getTokenUrl('funcs/flow/flowview.html');
            url += strFormat("&viewtype={0}&flowid={1}&execid={2}&dbdate={3}", urlParam.viewtype, urlParam.flowid, urlParam.execid, urlParam.dbdate);
            mainPages.addTab(urlParam.execid, urlParam.flowname || '流程', url);
            $('#myTab li').eq(0).find('.closeTab').remove();
            freeStateMsg();
            return;
        }
        //银行运营Logo 不需要开始菜单页面
        if(sessionStorage.getItem('sysLogoIndex') != 66){
            //添加空白页面
            mainPages.addTab('startPage', getENStr('开始'), thatStyle() == '风格五' ? getTokenUrl('startPage_5.html') : getTokenUrl('startPage.html'));
        }
        //隐藏关闭按钮
        $('#tab_li_' + 'startPage' + ' button').hide();
        // 菜单
        var ui_menu = $('#main-menu');
        g_menu_vPar = vPar;
        var myHomeInit; //个人首页
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
            if(node['name']=='大屏浏览'&&node['aLevel']==1){
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
                // 不是rpa社区 or 风格五则加载提示
                if (thatStyle() != '风格五') {
                    $('body').append(strFormat('<div id="li_{0}" class="showTitle" style="display:none">{1}</div>', node.id, getENStr(node.name)));
                }
            } else if (node.count == 0 && (node.name == '工作台' || node.name == '主页')) {
                if(vPar.getStr('SysLogo') == '安信证券'){
                    node.url = 'funcs/home/anxin_home.html'
                }
                //兼容后台未改表结构的，勿删
                var url = vPar.getBool('RPA') ? 'funcs/home/rpa_home.html' : node.url;
                homePageObj.id = node.id;
                homePageObj.title = getENStr(node.name);
                homePageObj.url = getTokenUrl(url);
            }
            if (vPar.getStr('SysLogo') == '行情监测' && node.count == 0 && node.name == '总览') {
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
            // 软件部署
            if (node.name == '软件部署') g_softpublishId = ('g_softpublishId', table.getValueByName("id")); //保存软件部署的id;
            // 制品库
            if (node.name == '制品库管理') mainPages.addTab(node.id, getENStr('制品库管理'), getTokenUrl('funcs/products/productmgr.html'));
            // 运营
            if (node.name == '个人首页') {
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
        // 搜索框
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
            emptyTemplate: '没有找到 "{{query}}"',
            source: { data: nodes },
            callback: {
                onClickAfter: function (node, a, item, event) {
                    mainPages.addTab(item.id, item.name, getTokenUrl(item.url));
                    event.preventDefault();
                }
            }
        });
        //IE浏览器高度问题
        $('#main-menu .left_content').css('margin-top', ("ActiveXObject" in window) ? '-30px' : '0px');
         //初始化页面打开后自动到指定页面
         if (urlParam.topage || (localStorage.getItem('topage_data') && localStorage.getItem('save_url_param') == 1)) {
            initToPage(nodes)
            freeStateMsg();
            return
        }
        //处理 user用户为1
        if (sessionStorage.getItem('RPAUser') == 1) {
            mainPagesClose(mainPages.sortPage[0]);
            mainPagesClose(mainPages.sortPage[0]);
            $('#center').width('100%');
            if (myHomeInit) myHomeInit();
            freeStateMsg();
        } else {
            //初始化首页
            initHomePage(homePageObj);
        }
    }
}
// 格式化名称 风格五用到
function getMenuName(str) {
    var dom = '<p class="text">{0}</p>';
    if (sessionStorage.getItem('sysLogo') === "银行运营平台") {
        return strFormat(dom, str);
    }
    else if (thatStyle() == '风格五' || sessionStorage.getItem('sysLogo') == '行情监测') {
        str = str.replace(/\s|(管理)$/g, ''); //空格或结尾是管理则截取
        if (str == '自动操作') return strFormat(dom, str.substring(2));
        if (str == '监控巡检') return strFormat(dom, str.substring(0, 2));
        return strFormat(dom, getENStr(str));
    } else {
        return strFormat('<span class="text" style="display:none">{0}</span>', getENStr(str));
    }
}
//初始化页面首页
function initHomePage(homePageObj) {
    //如果最后一次打开过页面，则直接显示最后一次打开的页面 ，不显示首页
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
    showStateMsg('正在加载...');
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
                    myList.push(value); //自己的只有一个
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
        //数据保存的 格式为  {....}time  最后time为打开页面时间间隔
        var index = list.lastIndexOf('}');
        var time = list.substring(index + 1) || 500;
        list = list.substring(0, index + 1);
        //获取设置首页数组
        var arr = list == "" ? [] : list.split(',');
        //遍历
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i].substring(1, arr[i].length - 1).replace(/\}\{/g, ',');
            if (item == '') continue;
            item = item.split(',');
            addTab(item[0], item[2], item[1], i);
        }
        //如果用户没有设置首页，则默认显示首页
        if ((arr.length == 0 && !$.isEmptyObject(homePageObj)) || homePageObj.isTbName) {
            setTimeout(function () {
                mainPages.addTab(homePageObj.id, homePageObj.title, homePageObj.url);
            }, arr.length * time)
        }
        //解决遍历异步问题
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
    //最后一次操作页面的时间， 如按键、鼠标点击
    if (topWindow.g_optPageLastTime === undefined) {
        topWindow.g_optPageLastTime = new Date().getTime();
    }
    //键盘
    document.addEventListener('keydown', function () {
        topWindow.g_optPageLastTime = new Date().getTime();
    }, true);
    //鼠标按下
    document.addEventListener('mousedown', function () {
        topWindow.g_optPageLastTime = new Date().getTime();
    }, true);
    //鼠标滚动
    document.addEventListener('mousewheel', function () {
        topWindow.g_optPageLastTime = new Date().getTime();
    }, true);


    //如果这个时间超过了指定时间 则注销
    var time = 20 * 1000; //多久检查一次
    var maxTime = 2 * 60 * 1000; //允许不操作的时长
    //定时检查是否超时
    (function a() {
        maxTime = parseInt(getSystemConfigByName('令牌超时(分钟)').value || 30) * 60 * 1000;
        //计算离上次操作的时间
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
        topWindow.msgBox(`由于您长时间不操作，系统将在60秒内自动注销`, {
            time: 60000
        });
    }
}
/**
 * @description 同步系统等级颜色
 * @param {Object} vPar
*/
function initWebLevelColor(vPar) {
    var table = new SQLTable(vPar.getTable('k_environment'));
    table.first();
    while (!table.eof()) {
        var name = table.getValueByName('Name');
        var value = table.getValueByName('Value');
        var index = getLevelIndex(name.replace('告警颜色', ''));
        systemLevelColor[index] = value;
        table.next();
    }
}

//上次点击一级菜单ID
var lastPageId = '-1';
function showChildPage(id, that) {
    actTagPage('startPage');
    layer.closeAll();
    $('.menu-list .li-click').removeClass('li-click');
    $('.menu-list .li-checked-icon').remove();
    $(that).addClass('li-click');
    var sysLogo = sessionStorage.getItem('sysLogo') || '';
    if (sysLogo.toUpperCase() != 'RPA社区' || sessionStorage.getItem('style') != '风格五')
        $(that).append('<span class="li-checked-icon"></span>');
    //解决Edge浏览器兼容问题
    if (userAgent.indexOf("Edge") > -1) compatibleEdge(true);
    lastPageId = id;
    //调用开始页面的内容初始化
    $("#tab_content_startPage iframe")[0].contentWindow.initPage(id);
}

//切换标签页
function actTagPage(id) {
    if (id == 'last') {
        if (mainPages.sortPage.length > 0) {
            id = mainPages.sortPage[mainPages.sortPage.length - 2];
            $("#tab_a_" + id).click();
        }
    } else {
        $("#tab_a_" + id).click(); //切换到开始页面
    }
}

//获取main首次加载是否完成
function mainPageIsInitDone() {
    return !$(".be-loading").hasClass('be-loading-active');
}

/* 
 * 当前风格
 * true 为默认
 */
function thatStyle() {
    var style = sessionStorage.getItem('style') || '';
    var sysLogoIndex = sessionStorage.getItem('sysLogoIndex');
    // 24下标为k-rpa，其他触发风格五的都是默认
    if (sysLogoIndex == 24 && style == '风格五') {
        return style;
    } else if (sysLogoIndex != 24) {
        return style;
    } else {
        return '';
    }
}
/*
* ******************************************** 界面 ******************************************
* ********************************************************************************************
*/
$(function () {
    $(window).bind('beforeunload', function (e) {
        if (!mainPages.getModifys()) return;
        var confirmationMessage = getENStr('确定离开此页吗?');
        (e || window.event).returnValue = confirmationMessage;	// Gecko and Trident
        return confirmationMessage;								// Gecko and WebKit
    });
    $('#miLogout').click(function (e) {
        msgYesNo(["是否要注销?"], [], function (result, params) {
            if (!result) return;
            showStateMsg("正在执行操作...");
            logoutToken();
        });
    });
    $("#miUser").click(function (e) {
        if ($('#SysLogo').text() == '制品库管理系统' && userID != 'admin') {
            showSetUserPro($("#miUser").data("LoginID"), function (outParams) { });
        } else {
            showUserConfirm({}, function () {
                freeStateMsg();
                // 旧弹窗
                // showSetUserPro($("#miUser").data("LoginID"), function (outParams) { });
                // 新弹窗
                showuserPros('修改人员', { id: sessionStorage.loginID, type: 1 }, true, function () { });
            });
        }
    });
    $("#myTab").on("click", "li", function () {
        if($('#SysLogo').text() == '制品库管理系统'){
           if($(this).find('span').text() !== '制品库管理'){
            initUrlState('')
           }else{
            initUrlState(window.topWindow.productPath)
           }
        }
        mainPages.addSortPage($(this).attr("id").replace("tab_li_", ""));
    });
    //切换大小
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
    //锁屏
    $('#miLock').click(function () {
        lock.onLock();
    })
    // 用户帮助信息
    $('#miHelpInfo').click(function () {
        var params = {
            id: helpInfo.id
        }
        showSetHelpInfo('用户帮助信息', params, function(){})
    })
});
function initUrlState(url) {
    if (sessionStorage.getItem('style') == '风格五' && sessionStorage.getItem('isRPALogo') === 'true') {
        window.topWindow.history.pushState(null, null, 'main_5.html'+ url);
    } else {
        window.topWindow.history.pushState(null, null, 'main.html'+ url);
    }
}
//给解锁按钮绑定事件
function initUnlockButtonClick(id) {
    //解锁
    $('#' + id).click(function () {
        var passwd = lock.getPasswd();
        showStateMsg("正在加载数据...");
        callServerFunc("TBaseDM", "Test2", new ParamArr(), function (vPar, sError) {
            freeStateMsg();
            if (sError != "") {
                alert(sError);
                return;
            }
            var key = vPar.getStr('key');
            showStateMsg("正在验证密码...");
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
 * 初始化大小 设定的是默认的
 * 其他风格需要自己重写!!!!!!!!!!!!
 * isFirst 是否为第一次 是为了修复无限切换问题
 */
function pageWidth(isFirst) {
    var leftWidth = toggole ? leftMaxWidth : leftMixWidth;
    var bodyWidth = $('body').width();
    $("#left").width(leftWidth / bodyWidth * 100 + '%')
    $('#center').width((1 - leftWidth / bodyWidth) * 100 + '%')
    var h = window.innerHeight - $('#mytop').outerHeight();
    // $('#left').height(h);
    $('#myTabContent').height(window.innerHeight - $('#mytop').height() - 40/** #myTab高 刚开始无法获取直接写死 **/ + 1/** #center只pingding-top 49 所以多了1PX **/);
}

/*
* ************************************* 解决浏览器兼容问题 *************************************
* *********************************************************************************************
*/
var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
//解决Edge开始页面宽度异常问题   isFirst 是为了修复无限切换问题
function compatibleEdge(isFirst) {
    toggole = !toggole;
    pageWidth(isFirst);
    toggole = !toggole;
    pageWidth(isFirst);
}

//重新初始化开始页面的高度
function setStartPageHeight() {
    var h = '100%';
    var isHide = $('#tab_content_startPage').is(':hidden');
    var activeTab = $('#myTab>.active>a');
    if (isHide) {
        h = window.innerHeight - $('#mytop').height() - $('#myTab').height() + 1/** #center只pingding-top 49 所以多了1PX **/ + 'px';
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
 * 获取url地址的值 main专用
 */
function getMainUrlParam() {
    var result = {};
    //分割字符串
    var strs = location.search.substring(1).split("&");
    //遍历数组中的每一个元素
    for (var i = 0; i < strs.length; i++) {
        var keyvalue = strs[i].split("=");
        var key = keyvalue[0];
        var value = keyvalue[1];
        result[key] = value;
    }
    return result;
}
// 接收运营反馈消息
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
                cont = strFormat('{0}创建了新的反馈', name);
                tid = table.getValueByName('Content');
            } else if (type == '7') {
                icon = 'iconxiaoxi1';
                cont = strFormat('{0}回复了你的反馈', name);
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
 *          定制页面加载后打开指定菜单 
 * 完整url 127.0.0.1:80/web/main.html?topage=flowview&flowid=
 * 
 * 流程跳转根据模式拼参数，示例为流程图  ?topage=flowview&flowid=
 * 组件管理跳转 ?topage=script
 * 组件编辑跳转 ?topage=scripteditor&scriptid=
 * 
 * 如果有token 可以在后面加&token=
 * 如果使用 用户令牌 则在后面加 appname=xx&apppass=xx
 */
function initToPage(menus) {
    var res = '[跳转页面]'
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
        return msgBox('没有该菜单权限');
    }
    //流程图定制
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
            if (getWebSystem('是否启用vue') == 1 && vueUrl) {
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
                mainPages.addTab(params.execid || params.flowid, params.flowname || '流程', url);
            }
        })
                
    }
    else if (url === 'script' || url === 'script/script') {
        var url = getTokenUrl('funcs/script/script.html');
        mainPages.addTab(MD5('组件管理') ,'组件管理', url);
    }
    else if (url === 'scripteditor' || url === 'script/scripteditor') {
        var vueUrl = AOM_VUE_PATH_DATA['funcs/script/scripteditor.html']
        if (getWebSystem('是否启用vue') == 1 && vueUrl) {
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
                    row["Remark"] = getENStr("正在进行[节点异常]");
                }
                else{
                    row["Remark"] = getENStr("正在进行");
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
                    return msgBox(date +'当天之前流程未执行')
                }
            } else {
                callback(rows[0])
            }
        } else {
            return msgBox('未能查找到该流程的执行记录')
            // callback('')
        }
    });
}