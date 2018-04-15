package com.demo.i18n.tools.service;

import java.io.IOException;
import java.util.List;

import org.elasticsearch.action.search.SearchResponse;

public interface RestEsService {



	void createIndex(String templateDesignData, String templateName, String locale);

	void updateIndex(String templateDesignData, String templateName, String locale);

	SearchResponse searchTemplate(String id, String templateName, String locale);
	
	void bulkInsert(List<String> jsonValuesList) throws IOException;
}
