/**
 * PhoneGap is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) Matt Kane 2010
 * Copyright (c) 2011, IBM Corporation
 */

package com.google.zxing.client.android.plugin;

import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.Intent;

import com.google.zxing.client.android.CaptureActivity;
import com.google.zxing.client.android.Intents;

/**
 * This calls out to the ZXing barcode reader and returns the result.
 */
public class BarcodeScanner extends CordovaPlugin {
    private static final String SCAN = "scan";
    private static final String CANCELLED = "cancelled";
    private static final String FORMAT = "format";
    private static final String TEXT = "text";
    private static final String MODE = "mode";
    private static final String All_MODE = "all";//所有支持的码
    private static final String ONE_MODE = "one";//一维码
    private static final String TWO_MODE = "qr";//二维码
    
    private CallbackContext cbContext;

    public static final int REQUEST_CODE = 0x0ba7c0de;

    public String callback;

    /**
     * Constructor.
     */
    public BarcodeScanner() {
    }

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action        The action to execute.
     * @param args          JSONArray of arguments for the plugin.
     * @param callbackId    The callback id used when calling back into JavaScript.
     * @return              A PluginResult object with a status and message.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        
        this.cbContext = callbackContext;
    	
        if (action.equals(SCAN)) {
        	String mode = "";
        	if(args.length()>0){
        		try {
					mode = args.getString(0);
				} catch (JSONException e) {
					e.printStackTrace();
				}
        	}
        	scan(mode);
        	
        } else {
        	callbackContext.error("Invalid Action");
        	
            return false;
        }
        
        return true;
    }

	 /**
     * Starts an intent to scan and decode a barcode.
     * @param mode  PRODUCT_MODE | ONE_D_MODE | QR_CODE_MODE | DATA_MATRIX_MODE 
     */
    public void scan(String mode) {
    	Intent intentScan = new Intent();
    	intentScan.setClass(this.cordova.getActivity(), CaptureActivity.class);
    	intentScan.addCategory(Intent.CATEGORY_DEFAULT);
    	if(!mode.equals("")){
    		intentScan.putExtra(Intents.Scan.MODE, mode);
    	}

        this.cordova.startActivityForResult((CordovaPlugin) this, intentScan, REQUEST_CODE);
    }

    /**
     * Called when the barcode scanner intent completes
     *
     * @param requestCode       The request code originally supplied to startActivityForResult(),
     *                          allowing you to identify who this result came from.
     * @param resultCode        The integer result code returned by the child activity through its setResult().
     * @param intent            An Intent, which can return result data to the caller (various data can be attached to Intent "extras").
     */
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        if (requestCode == REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK) {
                JSONObject obj = new JSONObject();
                try {
                    obj.put(TEXT, intent.getStringExtra("result"));
                    obj.put(FORMAT, intent.getStringExtra("format"));
                    obj.put(CANCELLED, false);
                } catch(JSONException e) {
                    //Log.d(LOG_TAG, "This should never happen");
                }
                
                this.cbContext.success(obj);
                
            } else if (resultCode == Activity.RESULT_CANCELED) {
                JSONObject obj = new JSONObject();
                try {
                    obj.put(TEXT, "");
                    obj.put(FORMAT, "");
                    obj.put(CANCELLED, true);
                } catch(JSONException e) {
                    //Log.d(LOG_TAG, "This should never happen");
                }
                	
                this.cbContext.success(obj);
                
            } else {
            	
            	this.cbContext.error("Invalid Activity");

            }
        }
    }
}