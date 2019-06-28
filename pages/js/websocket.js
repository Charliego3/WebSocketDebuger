String.prototype.replaceAll = function (sptr, sptr1) {
    var str = this;
    while (str.indexOf(sptr) >= 0) {
        str = str.replace(sptr, sptr1);
    }
    return str;
};

String.prototype.endsWith = function (str) {
    if (str == null || str === "" || this.length === 0 || str.length > this.length)
        return false;
    return this.substring(this.length - str.length) === str;
};
String.prototype.startsWith = function (str) {
    if (str == null || str === "" || this.length === 0 || str.length > this.length)
        return false;
    return this.substr(0, str.length) === str;
};

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.format = function (fmt) {
    const o = {

        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (const k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

function setCookie(name, value) {
    const Days = 30;
    const exp = new Date();
    exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
    document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
}

function getCookie(name) {
    let arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
    if (arr === document.cookie.match(reg))
        return unescape(arr[2]);
    else
        return null;
}

function delCookie(name) {
    const exp = new Date();
    exp.setTime(exp.getTime() - 1);
    const cval = getCookie(name);
    if (cval != null)
        document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
}


let $win;
let msgCount = 0;
let reConnect = false;
let msgs = new Map();
let isPause = false;

(function (window, undefined) {
    $(function () {
        let socket;
        $win = $('body');


        $win.find('#inp_url').val(getCookie("LastURL"));
        $win.find('#inp_send').val(getCookie("LastSend"));

        let showMessage = function (msg, type) {
            let maxSize = parseInt($("#inp_msgCount").val());
            if (isNaN(maxSize) || maxSize === undefined || maxSize === 0) {
                maxSize = 100;
            }
            const datetime = new Date();
            const tiemstr = datetime.format("yyyy-MM-dd hh:mm:ss.S");
            if (type) {
                const $p = $('<div class="panel panel-info">').attr("id", "respPanel" + msgCount).prependTo($win.find('#div_msg'));
                let style = "default";
                if (type === 1) {
                    type = "SEND";
                    style = "info";
                } else if (type === 2) {
                    type = "RECEIVE";
                    style = "warning";
                } else if (type === 3) {
                    type = "ERROR";
                    style = "danger";
                }

                const datetime = new Date();

                const row = '<div class="row">';
                // const title = '<div style="float: left;padding-right: 10px;padding-left: 10px;"><span class="label label-' + style + '">' + type + '</span> </div> ';
                const title = `<div style="float: left;padding-right: 10px;padding-left: 10px;">
                    <button type="button" id="btn_show_array_${msgCount}" style="height: 22px;" class="btn btn-xs btn-${style}">${type}</button></div>`;
                const body = '<div style="padding-right: 185px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;">' + msg + '</div>';
                const timeStr = `<div style="float: right;padding-right: 10px;margin-top: -20px;" class="blockquote-reverse">
                        ${datetime.format("yyyy-MM-dd hh:mm:ss.S").toString()}</div>`;
                const rowEnd = '</div>';
                const $type = $('<div class="panel-heading">').html(row + title + body + timeStr + rowEnd).appendTo($p);

                var index = msgCount;
                $win.find(`#btn_show_array_${index}`).click(function() {
                    let msg = msgs.get(index);
                    let $arrayPanel = $(`.panel-body #respPanel${index}`);
                    let $arrayPanelBody = $(`.panel-body #respPanel${index} .panel-body`);
                    if ($arrayPanelBody.html() === undefined) {
                        $('<div class="panel-body">').css("padding", "0 10px").html(msg).appendTo($arrayPanel);
                        attachEvent();
                    } else {
                        $arrayPanelBody.remove();
                    }
                });

                try {
                    const testObj = eval("a=" + msg);
                    if (testObj instanceof Object) {
                        msg = new JSONFormat(msg, 4).toString();
                    }
                } catch (e) {
                    msg = '<p class="text-danger" style="margin: 10px 10px 10px 10px">' + msg + '</p>'
                }

                msgs.set(msgCount, msg);
                // var $msg = $('<div class="panel-body">').css("padding", "0px").html(msg).appendTo($p);

                if (msgCount > maxSize) {
                    $('#respPanel' + (msgCount - maxSize)).remove();
                    msgs.delete(msgCount - maxSize);
                }
                msgCount++;
            } else {
                const $center = $('<center>').text(msg + '(' + tiemstr + ')').css({'font-size': '12px'}).appendTo($win.find('#div_msg'));
            }
        };

        $win.find('#refresh_clearcache').click(function () {
            $.yszrefresh();
        });

        $win.find('#btn_conn').attr('disabled', false);
        $win.find('#btn_reConn').attr('disabled', true);
        $win.find('#btn_close').attr('disabled', true);
        $win.find('#btn_pause').attr('disabled', true);

        $win.find('#btn_conn').click(function () {
            //连接按钮
            const url = $win.find('#inp_url').val();
            if (url === '') {
                alert("请输入链接地址");
                return;
            }
            clearMsg();
            $win.find('#btn_conn').attr('disabled', true);
            $win.find('#btn_close').attr('disabled', false);
            $win.find('#btn_reConn').attr('disabled', false);
            // 创建一个Socket实例
            socket = new WebSocket(url);

            setCookie("LastURL", url);

            // $("#msgTitle").html(buildTitleMsg("开始连接", "warning"));
            $("#connectState").html(buildConnectState("开始连接", "warning"));
            // $("#connectTime").remove();
            // $("#topView").append(now());
            $("#connectTime").text(now());
            // 打开Socket
            socket.onopen = function (event) {
                // 发送一个初始化消息
                $("#connectState").html(buildConnectState("连接成功", "success"));
            };
            // 监听消息
            socket.onmessage = function (eve) {
                if (!isPause) {
                    showMessage(eve.data, 2);
                }
            };
            // 监听Socket的关闭
            socket.onclose = function (event) {
                socket = null;
                $("#connectState").html(buildConnectState("断开连接", "danger"));
                $win.find('#btn_conn').attr('disabled', false);
                $win.find('#btn_close').attr('disabled', true);
                $win.find('#btn_reConn').attr('disabled', true);
                $win.find('#btn_pause').attr('disabled', true);
                if (reConnect) {
                    $win.find('#btn_conn').trigger("click");
                    reConnect = false;
                }

            };
        });

        $win.find('#btn_pause').click(function () {
            isPause = !isPause;
            if (isPause) {
                $(this).attr("class", "btn btn-xs btn-success");
                $(this).text("恢复接收消息");
            } else {
                $(this).attr("class", "btn btn-xs btn-danger");
                $(this).text("暂停接收消息");
            }
        });

        //关闭按钮
        $win.find('#btn_close').click(function () {
            if (socket) {
                socket.close();
            }
            // 恢复暂停按钮
            isPause = false;
            $win.find('#btn_pause').attr("class", "btn btn-xs btn-danger");
            $win.find('#btn_pause').text("暂停接收消息");
        });

        //关闭按钮
        $win.find('#btn_reConn').click(function () {
            $win.find('#btn_close').trigger("click");
            reConnect = true;
            // 恢复暂停按钮
            isPause = false;
            $win.find('#btn_pause').attr("class", "btn btn-xs btn-danger");
            $win.find('#btn_pause').text("暂停接收消息");
        });

        //发送按钮
        $win.find('#btn_send').click(function () {
            var msg = $win.find('#inp_send').val();

            setCookie("LastSend", msg);

            if (!socket) {
                showMessage("WebSocket 未连接.", 3);
                return;
            }

            if (socket && msg) {
                socket.send(msg);
                showMessage(msg, 1);
                $win.find('#btn_pause').attr('disabled', false);
            }

        });

        //发送快捷键
        $win.find('#inp_send').keyup(function () {
            if (event.ctrlKey && event.keyCode === 13) {
                $win.find('#btn_send').trigger('click');
            }
        });

        $win.find('#btn_clear').click(function () {
            clearMsg();
        });
    });
})(window);

function clearMsg() {
    $win.find('#div_msg').empty();
}

function showArray(index) {
    let msg = msgs.get(index);
    let $arrayPanel = $(`.panel-body #respPanel${index}`);
    let $arrayPanelBody = $(`.panel-body #respPanel${index} .panel-body`);
    if ($arrayPanelBody.html() === undefined) {
        $('<div class="panel-body">').css("padding", "0 10px").html(msg).appendTo($arrayPanel);
    } else {
        $arrayPanelBody.remove();
    }
}

function now() {
    const datetime = new Date();
    return datetime.format("yyyy-MM-dd hh:mm:ss.S");
}

function buildConnectState(msg, style) {
    return `<span class="label label-${style}">${msg}</span>`;
}

function buildTitleMsg(msg, style) {
    const datetime = new Date();
    const tiemstr = datetime.format("yyyy-MM-dd hh:mm:ss.S");
    return '<div class="row"> <div class="col-md-6"><span class="label label-' + style + '">' + msg + '</span> </div> <div class="col-md-6 blockquote-reverse">' + tiemstr + '</div>';
}
