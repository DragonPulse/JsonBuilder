package com.demo.i18n.tools.esjson.model;

import java.io.Serializable;
import java.util.List;

public class FieldMappingResponse implements Serializable {

    /**
	 * 
	 */
	private static final long serialVersionUID = -2814075726832958394L;

	private ExcelData childData;

    private List<ExcelData> parentData;

    public ExcelData getChildData() {
        return childData;
    }

    public void setChildData(ExcelData childData) {
        this.childData = childData;
    }

    public List<ExcelData> getParentData() {
        return parentData;
    }

    public void setParentData(List<ExcelData> parentData) {
        this.parentData = parentData;
    }
}
