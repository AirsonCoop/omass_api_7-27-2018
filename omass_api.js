omass_api=new function() {
	self=this;
	var isDevReady=false;
	var isJsonOK=false;
	var isReadyCnt=0;
	self.oMassConfig={};
	var devModel=null;
	var devUrl=null;
	var oMassParam={
		Voltage: 10, 
		Period: 200, 
		Width: 800
	}
	var Mode=0;
	var timer;
	var oMassJsonKey={
		patName: "Name", 
		patNo: "PatternNo", 
		patMode: "PatternMode", 
		voltageEn: "VoltogeEnable",
		freqEn: "FreqencyEnable",
		widthEn: "WidthEnable",   
		voltageDefault: "default_Volotage",
		freqDefault: "default_Freqency",
		widthDefault: "default_Pulse_Width",
		maxVoltage: "MaxVolatage", 
		maxFreq: "MaxFrequency", 
		maxWidth: "MaxWidth", 
		pattern: "Pattern",
		squenceMode: "Sequence_Mode", 
		loop: "PatternLoop",
		defaultV: "Default_Voltage", 
		sequence: "Sequence", 
		patternCmd: "PatternCmd",
		patDefault: "Pattern_Default"
	}
	
	function isJsonReady() {
		isJsonOK=true;
		self.isReady();
		if(isDevReady) {
			self.DevPlugIn(devModel, devUrl);
		}
	}
	
	this.init=function(_jdata) {
		readJsonAll(_jdata);
	}
	
	this.isReady=function(){
		console.log("omass_api is ready");
	}
	
	function readJsonAll(Jdata) {
    _url="oha_controller_options.txt?Cache=false";
		parseConfigJson(Jdata);
		isJsonReady();
	}
	
	function parseConfigJson(_jdata) {
		var _config=self.oMassConfig;
		_config[oMassJsonKey.pattern]=[];
		console.log("parseConfigJson start");
		if(_jdata.hasOwnProperty("SubPattern") && _jdata.hasOwnProperty(oMassJsonKey.pattern)) {
			for(_i in _jdata.Pattern) {
				if(_jdata.Pattern[_i].hasOwnProperty("Sequence")) {
					var _seq=_jdata.Pattern[_i]["Sequence"];
					var _patObj={};
					_patObj[oMassJsonKey.patName]=_jdata[oMassJsonKey.pattern][_i][oMassJsonKey.patName];
					_patObj["Sequence"]=[];
					for(_j in _seq) {
						if(_jdata.SubPattern.hasOwnProperty(_seq[_j])){
							_patObj["Sequence"].push(_jdata.SubPattern[_seq[_j]]);
						}
					}
					_config[oMassJsonKey.pattern].push(_patObj);
				}
			}
		}
	}
	
	this.getPatName=function(_pNo) {
		var _pat=self.oMassConfig.Pattern[_pNo];
		if(_pat!=null) {
			var _nameObj=_pat[oMassJsonKey.patName];
			var _name="";
			var _locale=oha_api.getLocale().localeCode;
			var _localeX=_locale.split("-");
			if(_nameObj.hasOwnProperty("default")) {
			  _name=_nameObj.default;
			}
			if(_nameObj.hasOwnProperty(_locale)) {
				_name=_nameObj[_locale];
			}
			else if(_nameObj.hasOwnProperty(_localeX[0])) {
				_name=_nameObj[_localeX[0]];
			}
			return _name;
		}
		console.log("Error Pattern number")
		return "";
	}
	
	function getPatCmd(_loop, _pat) {
		if(_loop.hasOwnProperty(oMassJsonKey.sequence)) {
			var _seq=_loop[oMassJsonKey.sequence];
			var _cmd="omass://pattern_254_";
			for(i=0;i<_seq.length;i++) {
				_cmd+=getCmdFromPatName(_seq[i], _pat);
				if(i!==(_seq.length-1)) {
					_cmd+=";";
				}
			}
	//        console.log("getPatCmd="+_cmd);
			return _cmd;
		}
		else {
			return null;
		}
	}
	
	function getCmdFromPatName(_patName, _patSet) {
		var _cmd="";
		var i=parseInt($("#FreqCtrlBlk").attr("value"));
//		var _freq=freqMapTab[i];
//	//	console.log("getCmdFromPatName:i="+i+", _freq="+_freq);
//		var _period=Math.round(1000/_freq);
//		var _width=widthMapTab[parseInt($("#WidthCtrlBlk").attr("value"))];
//		var _gapTime=parseInt($("#ModeCtrlBlk").attr("value"));
		if(_patSet.hasOwnProperty(_patName)) {
			var _p=_patSet[_patName];
			_cmd+=_p.Period+","+_p.Width+","+_p.Voltage+","+_p.Direction+","+_p.OP_Time+","+_p.Gap_Time;
			return _cmd;
		}
		else {
			throw "Error!!";
		}
	}
	
	this.setParams=function(_v, _f, _w) {
		var _pf=(1000/parseFloat(_f)).toFixed(0);
		var _pw=(parseInt(_w)/25).toFixed(0);
		oMassParam.Voltage=_v;
		oMassParam.Period=_pf;
		oMassParam.Width=_pw;
		if(isDevReady) {
			var _cmd="omass://param_"+_v+"_"+_pf+"_"+_pw;
			console.log("omassa_api.setParams, _cmd="+_cmd);
			oha_api.runOhaCmd(_cmd);
		}
	}
	
	this.updateUi= function() {
		self.stop();
		oha_api.runOhaCmd("oha://updateUi");
	}

	// 執行對應Pattern
	this.run=function(_n) {
		if(Mode != _n) {
			this.end();
			Mode = _n;
			oha_api.runOhaCmd("omass://opmode_2");
			runPatNum(_n);
		}
		else {
			oha_api.runOhaCmd("omass://opmode_2");
			runPatNum(_n);
		}
	}
	
	// 停止Pattern
	this.end=function() {
		clearTimeout(timer);
		oha_api.runOhaCmd("omass://stop");
		oha_api.runOhaCmd("omass://opmode_3");
	}

	this.start=function(){
		if(isDevReady) {
			oha_api.runOhaCmd("omass://start");
		}
	}
	
	this.stop=function(){
		if(isDevReady) {
			oha_api.runOhaCmd("omass://stop");
		}
	}
	
	this.DevPlugIn=function() {
		console.log("omass_api.DevPlugIn")
	}
	
	oha_api.DevPlugIn=function() {
		isDevReady=true;
		devModel=arguments[0];
		devUrl=arguments[1];
		if(isJsonOK) {
			self.DevPlugIn(devModel, devUrl);
		}
	}
	
	this.DevPlugOut=function() {
		console.log("omass_api.DevPlugOut")
	}
	
	oha_api.DevPlugOut=function() {
		isDevReady=false;
		self.DevPlugOut(arguments[0]);
	}
	oha_api.ohaConfig.isCheckModelName=false;
	
	// 執行對應Pattern
	function runPatNum(_n) {
		// 選擇Sequence
		var choos_pattern = 0;
		// 比較時間的參數
		var last_time = 0;
		var delay_time = 0;
		var init_time = true;
		var t = new Date();
		var n = t.getTime();
		// 計數
		function timedCount() {
			timer = setTimeout(function() {
				// 計數初始化
				if (init_time) {
					t = new Date();
					n = t.getTime();
					last_time = n;
					init_time = false;
				}
				else {
					// 計算累計時間
					count_delay_time();
					console.log("delay_time:"+delay_time);
					// 循環opTime與gapTime操作
					cmpTime();
				}
				timedCount();
			},50);
		}
		function count_delay_time() {
			t = new Date();
			n = t.getTime();
			delay_time = n - last_time;
			last_time = n;
		}
		var totalTime = 0;
		var compareTime = 0;
		var DuringExe = true;
		var init_exe = true;
		function cmpTime() {
			// opTime操作時間
			if(DuringExe) {
				// opTime初始
				if(init_exe) {
					compareTime = 1000 * getPattern_exeTime();
					// 計算Pattern模式的設定參數
					changeParam();
					omass_api.start();
					init_exe = false;
				}
				// 計算累計時間
				totalTime = totalTime + delay_time;
				console.log('totalTime:'+totalTime);
				// 時間到，轉換為gapTime操作
				if(totalTime >= compareTime) {
					totalTime = 0;
					init_exe = true;
					DuringExe = false;
				}
			}
			// gapTime操作時間
			else {
				// gapTime初始
				if(init_exe) {
					compareTime = 1000 * getPattern_idleTime();
					// 計算Pattern模式的設定參數
					// changeParam();
					omass_api.stop();
					init_exe = false;
				}
				// 計算累計時間
				totalTime = totalTime + delay_time;
				console.log('totalTime:'+totalTime);
				// 時間到，轉換opTime操作
				if(totalTime >= compareTime) {
					totalTime = 0;
					// 變換Sequence序列
					choos_pattern = choos_pattern + 1;
					if(choos_pattern >= getSequence_length()) {
						choos_pattern = 0;
					}
					init_exe = true;
					DuringExe = true;
				}
			}
		}
		// 取得Sequence數量
		function getSequence_length() {
			return omass_api.oMassConfig.Pattern[_n]['Sequence'].length;
		}
		function getPattern() {
			// console.log("pattern:"+omass_api.oMassConfig.Pattern[_n]);
			return	omass_api.oMassConfig.Pattern[_n];
		}
		function getPattern_arg() {
			let arg = patConfig.sequence[_n].toString();
			// console.log(patConfig[arg]);
			return arg;
		}
		// 取得opTime時間
		function getPattern_exeTime() {
			// let arg = getPattern_arg();
			let exeTime = omass_api.oMassConfig.Pattern[_n]['Sequence'][choos_pattern]['OP_Time'];
			console.log("exeTime:"+exeTime);
			return exeTime;
		}
		// 取得gapTime時間
		function getPattern_idleTime() {
			// let arg = getPattern_arg();
			let idleTime = omass_api.oMassConfig.Pattern[_n]['Sequence'][choos_pattern]['Gap_Time'];
			console.log("idleTime:"+idleTime);
			return idleTime;
		}
		// 取得Pattern電壓
		function getPattern_voltage() {
			let patVoltage = omass_api.oMassConfig.Pattern[_n]['Sequence'][choos_pattern]['Voltage'];
			return patVoltage;
		}
		// 取得Pattern週期
		function getPattern_period() {
			let patPeriod = omass_api.oMassConfig.Pattern[_n]['Sequence'][choos_pattern]['Period'];
			return patPeriod;
		}
		// 取得Pattern脈波寬度
		function getPattern_width() {
			let patWidth = omass_api.oMassConfig.Pattern[_n]['Sequence'][choos_pattern]['Width'];
			return patWidth;
		}
		// 計算Pattern的設定參數
		function changeParam() {
			let _v = getPattern_voltage();
			let symbol = _v.slice(0,1);
			let value = parseFloat(_v.slice(1));
			let _f = getPattern_period();
			let _w = getPattern_width();
			switch(symbol) {
				case "+":
				value = oMassParam.Voltage + value;
				break;
				case "-":
				value = oMassParam.Voltage - value;
				break;
				case "*":
				value = oMassParam.Voltage * value;
				break;
				case "/":
				value = oMassParam.Voltage / value;
				break;
			}
			value = parseInt(value);
			console.log("_v:"+value);
			patSetParam(value,_f,_w);
		}
		// 設定目前Pattern工作電壓、頻率、脈波寬度
		function patSetParam(_v, _f, _w) {
			var _pf=(1000/parseFloat(_f)).toFixed(0);
			var _pw=(parseInt(_w)/25).toFixed(0);
			if(isDevReady) {
				var _cmd="omass://param_"+_v+"_"+_pf+"_"+_pw;
				console.log("omassa_api.setParams, _cmd="+_cmd);
				oha_api.runOhaCmd(_cmd);
			}
		}
		// 確認opTime、gapTime循環時間
		let checkTime = getPattern_exeTime();
		if(checkTime == -1) {
			omass_api.start();
		}
		else {
			timedCount();
		}
	};
}