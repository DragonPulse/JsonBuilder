package com.demo.i18n.tools.esjson.model;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

@Component
public class ExcelData {

	private Map<String,String> dataMap = new HashMap<String,String>();

	public Map<String, String> getDataMap() {
		return dataMap;
	}

	public void setDataMap(Map<String, String> dataMap) {
		this.dataMap = dataMap;
	}
	
	
	
}
