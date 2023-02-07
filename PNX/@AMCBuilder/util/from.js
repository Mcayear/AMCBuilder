import {
    mc
} from '@LiteLoaderLibs/index.js';

const lang = {
    "form_main_btn_up": "上升到最顶层的方块",
    "form_main_btn_show_regin": "显示选区",
    "form_main_btn_fill": "填充选区",
    "form_main_btn_copy": "复制选区",
    "form_main_btn_paste": "粘贴",
    "form_main_btn_replace": "替换区域内的方块",
    "form_main_title": "AMCBuilder",
    "form_main_text": "当前Pos1: "
}

function MainForm(AMCBPlayer) {
    const minPos = AMCBPlayer.data.pos[0];
    const maxPos = AMCBPlayer.data.pos[1];
    AMCBPlayer.formBtnList = ['form_main_btn_up', 'form_main_btn_show_regin', 'form_main_btn_fill', 'form_main_btn_copy'];
    let sendButtons = [lang['form_main_btn_up'], lang['form_main_btn_show_regin'], lang['form_main_btn_fill'], lang['form_main_btn_copy']];
    let butImages = ["", "", "", ""];
    if (AMCBPlayer.copy_palette) {
        AMCBPlayer.formBtnList.push('form_main_btn_paste');
        sendButtons.push(lang['form_main_btn_paste']);
        butImages.push("");
    }
    AMCBPlayer.formBtnList.push('form_main_btn_replace');
    sendButtons.push(lang['form_main_btn_replace']);
    butImages.push("");
    AMCBPlayer.player().sendSimpleForm(lang['form_main_title'], `当前Pos1: ${minPos ? minPos.join(', ') : '未选择'}\n当前Pos2: ${maxPos ? maxPos.join(', ') : '未选择'}\n当前选区大小: ${AMCBPlayer.ReginSize}`, sendButtons, butImages, function(player, id){
        if (id === null) {return;}
        if (!AMCBPlayer.formBtnList) {return;}
        switch(AMCBPlayer.formBtnList[id]) {
			case 'form_main_btn_up': {
                cmdUpForm(AMCBPlayer);
                break;
            }
			case 'form_main_btn_show_regin': {
                AMCBPlayer.showRegin();
                break;
            }
            case 'form_main_btn_fill': {
                cmdFillForm(AMCBPlayer);
                break;
            }
			case 'form_main_btn_copy': {
                player.runcmd('amcb copy');
                break;
            }
			case 'form_main_btn_paste': {
                player.runcmd('amcb paste');
                break;
            }
            case 'form_main_btn_replace': {
                cmdReplaceForm(AMCBPlayer);
                break;
            }
        }
        AMCBPlayer.formBtnList = null;
    });
}
function cmdUpForm(AMCBPlayer) {
    let form = mc.newCustomForm();
    form.setTitle("/amcb up");
    form.addSwitch("在脚下放置方块", true);
    form.addSwitch("保持飞行状态", true);
    AMCBPlayer.player().sendForm(form, function(player, data) {
        if (!data) return MainForm(AMCBPlayer);
        let cmd = "amcb up";
        if (data[0]) cmd += " -g";
        if (data[1]) cmd += " -f";
        player.runcmd(cmd);
    });
}
function cmdFillForm(AMCBPlayer) {
    if (!AMCBPlayer.dataFillForm) AMCBPlayer.dataFillForm = null;
    let form = mc.newCustomForm();
    form.setTitle("/amcb fill");
    form.addInput("将被填充的方块", "例 “minecraft:stone 0”");
    if (AMCBPlayer.dataFillForm) {
        form.addLabel("上次填充的方块:\n"+AMCBPlayer.datsFillForm);
        form.addSwitch("使用上次的数据？", false);
    }
    AMCBPlayer.player().sendForm(form, function(player, data) {
        if (!data) return MainForm(AMCBPlayer);
        let cmd = "amcb fill ";
        if (data[2]) {
            cmd += AMCBPlayer.datsFillForm;
        } else if (data[0]) {
            AMCBPlayer.datsFillForm = data[0];
            cmd += data[0];
        } else {
            return MainForm(AMCBPlayer);
        }
        player.runcmd(cmd);
    });
}
function cmdReplaceForm(AMCBPlayer) {
    if (!AMCBPlayer.datsReplaceForm) AMCBPlayer.datsReplaceForm = {from: [], to: []};
    let form = mc.newCustomForm();
    form.setTitle("/amcb replace");
    form.addLabel("将被替换的方块:\n"+AMCBPlayer.datsReplaceForm.from.join('\n'));
    form.addInput("添加被替换的方块[From]", "例 “minecraft:grass 0,minecraft:stone”");
    form.addLabel("新方块:\n"+AMCBPlayer.datsReplaceForm.to.join('\n'));
    form.addInput("添加替换为的方块[To]", "例 “minecraft:grass_path 0|1,minecraft:clay 0|9”");
    form.addSwitch("存储数据以便下次使用", true);
    form.addSwitch("开始替换", false);
    AMCBPlayer.player().sendForm(form, function(player, data) {
        if (!data) return MainForm(AMCBPlayer);
        let cmd = "amcb replace";
        if (data[1]) AMCBPlayer.datsReplaceForm.from.push(...(data[1].split(",")));
        if (data[3]) AMCBPlayer.datsReplaceForm.to.push(...(data[3].split(",")));
        cmd += ' "'+AMCBPlayer.datsReplaceForm.from.join(',')+'"';
        cmd += ' "'+AMCBPlayer.datsReplaceForm.to.join(',')+'"';
        if (!data[4]) {
            AMCBPlayer.datsReplaceForm = null;
        }
        if (data[5]) {
            player.runcmd(cmd);
        } else {
            return MainForm(AMCBPlayer);
        }
    });
}
export {
    MainForm
};