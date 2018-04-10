package com.demo.i18n.tools.esjson.model;

import java.util.ArrayList;
import java.util.List;

public class ExcelFile {

	private List<String> columnHeaders = new ArrayList<String>();
	
	private List<ExcelData> excelDataList;

	public List<ExcelData> getExcelDataList() {
		return excelDataList;
	}

	public void setExcelDataList(List<ExcelData> excelDataList) {
		this.excelDataList = excelDataList;
	}
	
	
	public List<String> getColumnHeaders() {
		return columnHeaders;
	}

	public void setColumnHeaders(List<String> columnHeaders) {
		this.columnHeaders = columnHeaders;
	}

	
}
