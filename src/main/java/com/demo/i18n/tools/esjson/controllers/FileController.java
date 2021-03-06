package com.demo.i18n.tools.esjson.controllers;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.map.ObjectMapper;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.SearchHits;
import org.json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import com.alibaba.fastjson.JSONObject;
import com.demo.i18n.tools.esjson.model.ExcelData;
import com.demo.i18n.tools.esjson.model.ExcelFile;
import com.demo.i18n.tools.esjson.model.ExcelHeader;
import com.demo.i18n.tools.esjson.model.FieldMappingResponse;
import com.demo.i18n.tools.service.RestEsService;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.samskivert.mustache.Mustache;
import com.samskivert.mustache.Template;


@RestController
public class FileController {

	@Autowired
	ExcelHeader excelHeader;

	@Autowired
	RestEsService restEsService;
	
	private HttpServletRequest getRequestObject() {
		HttpServletRequest request = null;
		RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
		if (requestAttributes instanceof ServletRequestAttributes) {
			request = ((ServletRequestAttributes) requestAttributes).getRequest();

		}
		return request;
	}

	private String getFilePathAfterSavingFileToTemp(MultipartFile uploadfile) {
		try {
			HttpServletRequest request = getRequestObject();
			// Get the filename and build the local file path (be sure that the
			// application have write permissions on such directory)
			String filename = uploadfile.getOriginalFilename();
			String directory = "/temp/";
			String filepath = "";
			File f = new File(request.getServletContext().getRealPath("/") + directory);
			if (!f.exists()) {
				f.mkdir();
			}
			filepath = Paths.get(request.getServletContext().getRealPath("/") + directory, filename).toString();
			FileOutputStream writer = new FileOutputStream(filepath);
			writer.write(uploadfile.getBytes());
			writer.close();
			return filepath;
		} catch (Exception e) {
			System.out.println(e.getMessage());
			// return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
		}
		return "";
	}

	@RequestMapping(value = "/readHeaderFromFile", method = RequestMethod.POST)
	@ResponseBody
	public List<String> readHeaderFromFile(@RequestParam("uploadfile") MultipartFile uploadfile,
			@RequestParam("fileType") String fileType) throws EncryptedDocumentException, InvalidFormatException, IOException {
		String filePath = getFilePathAfterSavingFileToTemp(uploadfile);
		return readOnlyHeaders(filePath);
	} 
	
	@RequestMapping(value = "/buildJsonData", method = RequestMethod.POST)
	@ResponseBody
	public List<String> buildJsonData(@RequestParam("uploadfile") MultipartFile uploadfile,
			@RequestParam("locale") String locale,@RequestParam("templateName") String templateName,@RequestParam("uniqueCode") String uniqueCode,@RequestParam("templateDesign") String templateData) throws EncryptedDocumentException, InvalidFormatException, IOException {
		String filePath = getFilePathAfterSavingFileToTemp(uploadfile);
		
		Gson gson = new Gson();
		JsonObject jsonObject =  gson.fromJson(templateData, JsonObject.class); // parse
		jsonObject.addProperty("templateName", templateName); // modify
		jsonObject.addProperty("locale", locale); // modify
		jsonObject.addProperty("uniqueCode", uniqueCode); // modify
		String id = templateName+"_"+locale;
		JSONObject json = new JSONObject();
		json.put("templateDesign", jsonObject.toString());
		try {
			restEsService.updateIndex(json.toString(),id,locale);
			SearchResponse searchResponse =restEsService.searchTemplate(id,templateName, locale);
			if(searchResponse!=null) {
				List<String> jsonDataOfFileRows = generateJsonObjectFromFile(searchResponse,filePath);
				restEsService.bulkInsert(jsonDataOfFileRows);
				System.out.println(jsonDataOfFileRows);
			}
		}catch(Exception e) {
			e.printStackTrace();
		}
		
		return readOnlyHeaders(filePath);
	} 

	
	private Map<String,Object> getTemplateDesign(SearchResponse searchResponse){
		SearchHits hits = searchResponse.getHits();
		SearchHit[] searchHits = hits.getHits();
		if(searchHits.length>0) {
			return searchHits[0].getSourceAsMap();
		}
		return null;
	}
	
	
	
	private List<String> buildFileDataToJson(ExcelFile excelFile, String templateDesign){
		List<String> jsonFileRowsList = new ArrayList<>();
		Template mustacheTemplate = Mustache.compiler().compile(templateDesign);
		for(ExcelData excelRow : excelFile.getExcelDataList()) {
			jsonFileRowsList.add(mustacheTemplate.execute(excelRow.getDataMap()));
		}
		return jsonFileRowsList;
	}
	
	private List<String> generateJsonObjectFromFile(SearchResponse searchResponse, String filePath) throws EncryptedDocumentException, InvalidFormatException, IOException{
		ExcelFile excelFile = convertRawFileToExcelFile(filePath);
		Map<String,Object> templateDesignMap = getTemplateDesign(searchResponse);
		JSONObject templateJsonObject = new JSONObject();
		templateJsonObject.putAll(templateDesignMap);
		String templateDesign = templateJsonObject.get("templateDesign").toString();
		
		List<String> jsonOfFileRows = buildFileDataToJson(excelFile,templateDesign);
		
		return jsonOfFileRows;
	}


	public Map<String,List<ExcelData>> buildDictoryBasedonColumnKey(ExcelFile parentFile,String parentColumn){
		Map<String,List<ExcelData>> dataDictionary = new HashMap<>();
		for(ExcelData excelData : parentFile.getExcelDataList()){
			System.out.println(excelData.getDataMap().get(parentColumn));
			if(dataDictionary.containsKey(excelData.getDataMap().get(parentColumn))){
				dataDictionary.get(excelData.getDataMap().get(parentColumn)).add(excelData);
			}else{
				List<ExcelData> excelDataList = new ArrayList<>();
				excelDataList.add(excelData);
				dataDictionary.put(excelData.getDataMap().get(parentColumn),excelDataList);
			}
		}


		return dataDictionary;
	}





	private List<String> readOnlyHeaders(String filePathAndName)
			throws EncryptedDocumentException, InvalidFormatException, IOException {
		// Creating a Workbook from an Excel file (.xls or .xlsx)
		Workbook workbook = WorkbookFactory.create(new File(filePathAndName));
		Sheet sheet = workbook.getSheetAt(0);
		List<String> columnHeaders = new LinkedList<>();
		Row row = sheet.getRow(0); // Get first row
		short minColIx = row.getFirstCellNum(); // get the first column index for a row
		short maxColIx = row.getLastCellNum(); // get the last column index for a row
		for (short colIx = minColIx; colIx < maxColIx; colIx++) { // loop from first to last index
			Cell cell = row.getCell(colIx); // get the cell
			columnHeaders.add(cell.getStringCellValue());
		}
		return columnHeaders;
	}

	private ExcelFile convertRawFileToExcelFile(String filePathAndName)
			throws EncryptedDocumentException, InvalidFormatException, IOException {

		ExcelFile excelFile = new ExcelFile();

		// Creating a Workbook from an Excel file (.xls or .xlsx)
		Workbook workbook = WorkbookFactory.create(new File(filePathAndName));
		Sheet sheet = workbook.getSheetAt(0);
		// ****************************
		Map<String, Integer> columnNameAndIndexMap = new HashMap<String, Integer>(); // Create map
		List<String> columnHeaders = new LinkedList<>();
		Row row = sheet.getRow(0); // Get first row
		// following is boilerplate from the java doc
		short minColIx = row.getFirstCellNum(); // get the first column index for a row
		short maxColIx = row.getLastCellNum(); // get the last column index for a row
		for (short colIx = minColIx; colIx < maxColIx; colIx++) { // loop from first to last index
			Cell cell = row.getCell(colIx); // get the cell
			columnHeaders.add(cell.getStringCellValue());
			columnNameAndIndexMap.put(cell.getStringCellValue(), cell.getColumnIndex());// add the cell contents (name
																						// of column) and cell index to
																						// the map
		}
		List<ExcelData> excelDataList = new ArrayList<>();
		int count = 0;
		for (Row rowTemp : sheet) {
			ExcelData excelData = new ExcelData();
			Map<String,String> dataMap = new HashMap<String,String>();
			if (count != 0) {//Skip column with headers
				for (String headerName : columnHeaders) {
					String rowData = "";
					if (rowTemp.getCell(columnNameAndIndexMap.get(headerName)) != null) {
						dataMap.put(headerName, getCellData(headerName, rowTemp.getCell(columnNameAndIndexMap.get(headerName))));
					} else {
						dataMap.put(headerName, rowData);
					}

				}
				excelData.setDataMap(dataMap);
				excelDataList.add(excelData);
			}
			count++;
		}
		excelFile.setColumnHeaders(columnHeaders);
		excelFile.setExcelDataList(excelDataList);
		return excelFile;
	}

	private static String getCellData(String columnHeader, Cell cell) {
		if (cell != null) {
			switch (cell.getCellTypeEnum()) {
			case BOOLEAN:
				return ((Boolean) cell.getBooleanCellValue()).toString();
			case NUMERIC:
				String strCellValue = null;
				if (DateUtil.isCellDateFormatted(cell)) {
					SimpleDateFormat dateFormat = new SimpleDateFormat(
							"dd/MM/yyyy");
					strCellValue = dateFormat.format(cell.getDateCellValue());
				} else {
					Double value = cell.getNumericCellValue();
					Long longValue = value.longValue();
					strCellValue = new String(longValue.toString());
				}
				return strCellValue;
			case STRING:
				return (cell.getStringCellValue());
			case BLANK:
				return "";
			case ERROR:
				return "";// (cell.getErrorCellValue());
			// CELL_TYPE_FORMULA will never occur
			case FORMULA:
				return "";
			}
		}
		return null;
	}
}
