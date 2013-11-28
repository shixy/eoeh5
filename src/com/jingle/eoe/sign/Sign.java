package com.jingle.eoe.sign;

import org.apache.cordova.CordovaArgs;
import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONException;

public class Sign extends CordovaPlugin {

	/**
	 * 对key进行签名
	 */
	@Override
	public boolean execute(String action, CordovaArgs args,
			CallbackContext callbackContext) throws JSONException {
		if(action.equals("get")){
			String key = args.getString(0);
			callbackContext.success(Utility.getParams(key));
		}
		
		return true;
	}
	
}
