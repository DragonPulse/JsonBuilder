package com.demo.i18n.tools.service;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;
import org.elasticsearch.action.ActionListener;
import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.index.IndexResponse;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.action.update.UpdateRequest;
import org.elasticsearch.action.update.UpdateResponse;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.unit.TimeValue;
import org.elasticsearch.common.xcontent.XContentType;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.SearchHit;
import org.elasticsearch.search.SearchHits;
import org.elasticsearch.search.builder.SearchSourceBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RestEsServiceImpl implements RestEsService {
	
	@Value("${es.template.index.name}")
	private String templateIndexName;
	
	@Value("${es.template.type.name}")
	private String templateTypeName;
	
	@Value("${es.template.mapping.values.index.name}")
	private String templateMappingIndexName;
	
	@Value("${es.template.mapping.values.type.name}")
	private String templateMappingTypeName;

	@Autowired
	RestHighLevelClient restHighLevelClient;

	@Override
	public void updateIndex(String templateDesignData, String templateName, String locale) {

		IndexRequest indexRequest = new IndexRequest(templateIndexName, templateTypeName, templateName)
				.source(templateDesignData, XContentType.JSON);
		UpdateRequest updateRequest = new UpdateRequest(templateIndexName, templateTypeName, templateName)
				.doc(templateDesignData, XContentType.JSON).upsert(indexRequest);
		UpdateRequest request = new UpdateRequest(templateIndexName, templateTypeName, templateName);
		request.doc(templateDesignData.getBytes(), XContentType.JSON);
		request.upsert(templateDesignData, XContentType.JSON);
		UpdateResponse response;
		try {
			response = restHighLevelClient.update(request);
			System.out.println(response.toString());
		} catch (IOException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}

		// Async Mode
		// ActionListener<UpdateResponse> listener = new
		// ActionListener<UpdateResponse>() {
		// @Override
		// public void onResponse(UpdateResponse updateResponse) {
		//
		// }
		//
		// @Override
		// public void onFailure(Exception e) {
		//
		// }
		// };
		// restHighLevelClient.updateAsync(request, listener);

		// Sync Mode
		// try {
		// UpdateResponse updateResponse = restHighLevelClient.update(request);
		// } catch (IOException e) {
		// // TODO Auto-generated catch block
		// e.printStackTrace();
		// }
	}

	@Override
	public void createIndex(String templateDesignData, String templateName, String locale) {

		IndexRequest request = new IndexRequest(templateIndexName, templateTypeName, templateName + "_" + locale);
		request.source(templateDesignData, XContentType.JSON);
		ActionListener<IndexResponse> listener = new ActionListener<IndexResponse>() {
			@Override
			public void onResponse(IndexResponse indexResponse) {
				System.out.println(indexResponse.toString());
			}

			@Override
			public void onFailure(Exception e) {

			}
		};
		// restHighLevelClient.indexAsync(request, listener);
		try {
			restHighLevelClient.index(request);
		} catch (IOException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}

		// TODO Auto-generated method stub
		// GetRequest getRequest = new GetRequest(
		// "schools",
		// "school",
		// "1");
		// ActionListener<GetResponse> listener = new ActionListener<GetResponse>() {
		// @Override
		// public void onResponse(GetResponse getResponse) {
		// System.out.println(getResponse.getVersion());
		// }
		//
		// @Override
		// public void onFailure(Exception e) {
		//
		// }
		//
		// };
		// try {
		// GetResponse getResponse = restHighLevelClient.get(getRequest);
		// } catch (IOException e1) {
		// // TODO Auto-generated catch block
		// e1.printStackTrace();
		// }

		// restHighLevelClient.getAsync(getRequest, listener);
	}

	@Override
	public SearchResponse searchTemplate(String id, String templateName, String locale) {
		SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
		sourceBuilder.query(QueryBuilders.termQuery("_id", id));
		sourceBuilder.timeout(new TimeValue(60, TimeUnit.SECONDS));

		SearchRequest searchRequest = new SearchRequest();
		searchRequest.source(sourceBuilder);
		try {
			SearchResponse searchResponse = restHighLevelClient.search(searchRequest);
			System.out.println(searchResponse);
			SearchHits hits = searchResponse.getHits();
			long totalHits = hits.getTotalHits();
			float maxScore = hits.getMaxScore();

			SearchHit[] searchHits = hits.getHits();
			for (SearchHit hit : searchHits) {
				// do something with the SearchHit
				Map<String, Object> sourceAsMap = hit.getSourceAsMap();
				String index = hit.getIndex();
				String type = hit.getType();
				String responseId = hit.getId();
				float score = hit.getScore();
				System.out.println(sourceAsMap);
			}
			return searchResponse;
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		return null;
	}

	@Override
	public void bulkInsert(List<String> jsonValuesList) throws IOException {
		// TODO Auto-generated method stub
		BulkRequest request = new BulkRequest();
		ObjectMapper mapper = new ObjectMapper();
		Map<String, Object> map = new HashMap<String, Object>();
		
		for (String jsonData : jsonValuesList) {
			IndexRequest indexRequest = new IndexRequest(templateIndexName,templateMappingTypeName);
			indexRequest.source(jsonData, XContentType.JSON);
			request.add(indexRequest);
//			request.add(new IndexRequest(index, type)  
//			        .source(XContentType.JSON,mapper.readValue(jsonData, new TypeReference<Map<String, Object>>(){})));
		}
		try {
			BulkResponse bulkResponse = restHighLevelClient.bulk(request);
			System.out.println(bulkResponse);
		}catch(Exception e) {
			e.printStackTrace();
			throw e;
		}
		
	}

}
