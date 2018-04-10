let dataSearchMap = {};
let serviceRes={};
$(document).ready(function() {

	$("#btnUploadParent").click(function() {
		readHeader("parentFile");
	});

	$("#btnUploadChild").click(function() {
		readHeader("childFile");
	});

	$("#btnMatchFiles").click(function() {
		uploadBothFile();
	});

    $("#groupSubmit").click(function(e) {
        e.preventDefault();
        console.log(generateGroupResultJson());
    });

	$(document).on('click', '.childData', function () {
		//console.log(this);
		let id = $(this).attr('id');
		$('.'+id).toggleClass('off');
        $(this).toggleClass('on');
    });

    $("#searchBar input[type=search]").on('keypress', function (){
        if (event.keyCode == 13) {
            event.preventDefault();

        }
	});

	$("#searchBar input[type=search]").on('keyup', function () {
            $('#progressBar').fadeIn();
            let search = $(this).val().toLowerCase();
            console.log(search);
            if(search&&search.length>0){

                let p = new Promise(function (resolve, reject) {


                    $(".childData").removeClass("off");
                    $(".childData").removeClass("on");
                    $(".parentData").addClass("off");
                    for(key in dataSearchMap){
                        if(dataSearchMap[key].indexOf(search)===-1){
                            $("#"+key).addClass("off");
                        }
                    }
                    resolve("success");
                });
                p.then(function () {
                    $('#progressBar').fadeOut();
                });
            }else{
                $(".childData").removeClass("off");
                $(".childData").removeClass("on");
                $(".parentData").addClass("off");
                $('#progressBar').fadeOut();
            }

    });


    $("#searchBar input[type=checkbox]").change(function () {
        $('#progressBar').fadeIn();
    	if(this.checked){
            let p = new Promise(function (resolve, reject) {
                buildPagenation(serviceRes,1);
                resolve("success");
            });
            p.then(function () {
                $('#progressBar').fadeOut();
            });
		}else{
            let p = new Promise(function (resolve, reject) {
                buildTable(serviceRes);
                //buildPagenation(data,1);
                resolve("success");
            });
            p.then(function () {
                $('#progressBar').fadeOut();
            });
		}

    });

    $(document).on('click', "#pageDiv span", function () {
        $('#progressBar').fadeIn();
        $("#pageDiv span.selected").removeClass("selected");
        $(this).addClass("selected");
		let pageNum = parseInt(this.innerHTML);
		console.log(pageNum);
        let p = new Promise(function (resolve, reject) {
            buildPagenation(serviceRes,pageNum);
            resolve("success");
        });
        p.then(function () {
            $('#progressBar').fadeOut();
        });
    });


    $("#groupName").on('keydown', function (e) {
        if (e.which === 13) {
            e.preventDefault();
            if(e.target.value.length>0){
                var newGroup = $("<div id='"+e.target.value+"' class='itemGroup' draggable='true' ondrop='drop(event)' ondragover='allowDrop(event)' ondragstart='drag(event)'><h2>"+e.target.value+"</h2></div>");
                $("#groupDiv").append(newGroup);
                e.target.value="";
            }
        }
    })
});

function allowDrop(e) {
    e.preventDefault();
}

function drag(e) {
    e.dataTransfer.setData("text", e.target.id);
}

function drop(e) {
    e.preventDefault();
    var data = e.dataTransfer.getData("text");
    var child = document.getElementById(data);
    //console.log(data);
    //console.log(isDescendant(document.getElementById("groupDiv"),e.target));
    //console.log(getMostCloseParentElementWithOnDrop(e.target));
    if(isDescendant(document.getElementById("groupDiv"),e.target)){
        getMostCloseParentElementWithOnDrop(e.target).appendChild(child);
    }

}


function isDescendant(parent, child) {
    var node = child;
    while (node != null) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

function getMostCloseParentElementWithOnDrop(element) {
    while(!element.hasAttribute('ondrop')){
        element= element.parentElement;
    }
    return element;
}

function  generateGroupResultJson(element) {
    if(element===null||element===undefined){
        element = document.querySelector("#groupDiv");
    }
    let array = element.children;
    let result ={};
    //console.log(array);
    for(let i=0; i<array.length; i++){
        console.log()
        if(array[i].nodeName === "DIV"){
           result[array[i].getAttribute("id")] = generateGroupResultJson(array[i]);
        }else if(array[i].nodeName === "LI"){
            result[array[i].getAttribute("id")]="0";
        }
    }
    //console.log(result);
    return result;
}

function createTable(jsonData) {
	var generated = '';
	for (var i = 0; i < jsonData.length; i++) {
		if (jsonData[i].menuParent == -1) {
			// parent menu
			generated = generated + '<tr class="treegrid-' + jsonData[i].menuId
					+ '"><td>' + jsonData[i].menuName + '</td></tr>';
			// TODO recursive here
			var recursiveResult = generateChildsRecursively(jsonData[i],
					generated);
			generated = recursiveResult;
		}
	}
	return generated;
}

function generateChildsRecursively(jsonData, generated) {
	for (var i = 0; i < jsonData.children.length; i++) {
		generated = generated + '<tr class="treegrid-'
				+ jsonData.children[i].menuId + ' treegrid-parent-'
				+ jsonData.menuId + '"><td>' + jsonData.children[i].menuName
				+ '</td></tr>';
		generated = generateChildsRecursively(jsonData.children[i], generated);
	}
	return generated;
}

function uploadBothFile() {

    $('#progressBar').fadeIn();
    $('#searchBar').fadeIn();
	var form;
	form = new FormData();
	form.append("uploadparentfile", document
			.getElementById('upload-parentfile-input').files[0]);
	form.append("uploadchildfile", document
			.getElementById('upload-childfile-input').files[0]);
	//form.append("parentColumn", $('#columnHeaderParent').val());
	form.append("childColumn", $('#columnHeaderChild').val());
	$.ajax({
		url : "/matchFiles",
		type : "POST",
		data : form,
		enctype : 'multipart/form-data',
		processData : false,
		contentType : false,
		cache : false,
		success : function(data) {
			console.log(data);
            serviceRes= data;

            let p = new Promise(function (resolve, reject) {
                buildTable(data);
                //buildPagenation(data,1);
                resolve("success");
            });
			p.then(function () {
                $('#progressBar').fadeOut();
            })
            
			
			
			
			
			
			
		},
		error : function() {
			// Handle upload error
			// ...
		}
	});
}
/**
 * Upload the file sending it via Ajax at the Spring Boot server.
 */
function readHeader(fileType) {
	var form;
	var url;
	if (fileType == "parentFile") {
		form = new FormData();
		var ins = document.getElementById('upload-parentfile-input').files[0];
		form.append("uploadfile", ins)
		form.append("fileType", fileType);
		url = "/readHeaderFromFile;"
	} else {
		form = new FormData();
		var ins = document.getElementById('upload-childfile-input').files[0];
		form.append("uploadfile", ins)
		form.append("fileType", fileType);
		url = "/readHeaderFromFile;"
	}
	$.ajax({
		url : url,
		type : "POST",
		data : form,
		enctype : 'multipart/form-data',
		processData : false,
		contentType : false,
		cache : false,
		success : function(data) {
			var options = [];
			options.push('<option>-- Select Column header  --</option>');
			
			$.each(data, function(i, item) {
				options.push($('<option/>', {
					value : item,
					text : item
				}));
				$("#columnsList").append('<li id="'+item+'" draggable="true" ondragstart="drag(event)">'+i+'.'+item+'<span style="color: #5cb85c" class="ion-arrow-move"></span></li>');
			});
			/*
			$("#columnsList").sortable({
				group: 'sortable',
				pullPlaceholder: false,
				  // animation on drop
				  onDrop: function  ($item, container, _super) {
				    var $clonedItem = $('<li/>').css({height: 0});
				    $item.before($clonedItem);
				    $clonedItem.animate({'height': $item.height()});

				    $item.animate($clonedItem.position(), function  () {
				      $clonedItem.detach();
				      _super($item, container);
				    });
				  },

				  // set $item relative to cursor position
				  onDragStart: function ($item, container, _super) {
				    var offset = $item.offset(),
				        pointer = container.rootGroup.pointer;

				    adjustment = {
				      left: pointer.left - offset.left,
				      top: pointer.top - offset.top
				    };

				    _super($item, container);
				  },
				  onDrag: function ($item, position) {
				    $item.css({
				      left: position.left - adjustment.left,
				      top: position.top - adjustment.top
				    });
				  }
			});
			*/
			if (fileType == "parentFile") {
				//$('#columnHeaderParent').html(''); // Set the Dropdown as Blank before new Data
				//$('#columnHeaderParent').append(options);
			} else {
				$('#columnHeaderChild').html(''); // Set the Dropdown as Blank before new Data
				$('#columnHeaderChild').append(options);
			}

		},
		error : function() {
			// Handle upload error
			// ...
		}
	});
} // function uploadFile


/* Build Table*/

function buildTable(res){
    dataSearchMap = {};
    $('table').remove();
	if(res){
        let table= document.createElement("table");

		for(let i=0; i<res.length;i++){
            if(res[i]["childData"]){
                let keyRow= document.createElement("tr");
            	if(i==0){
                    keyRow.setAttribute("class","key childData");
				}

                let valueRow= document.createElement("tr");
                valueRow.setAttribute("class","value childData");
                if(res[i]["parentData"]){
                	valueRow.classList.add("hasParentData");
				}
                valueRow.setAttribute("id", i+"childData");
                //add data to map

				dataSearchMap[i+"childData"]="";

                for(key in res[i]["childData"]["dataMap"]){
                	if(i==0){
                        let item0= document.createElement("td");
                        item0.innerHTML = key;
                        keyRow.appendChild(item0);
					}

                    let item1= document.createElement("td");
                    item1.innerHTML = res[i]["childData"]["dataMap"][key];
                    valueRow.appendChild(item1);

					dataSearchMap[i+"childData"] =dataSearchMap[i+"childData"]+ ";"+ res[i]["childData"]["dataMap"][key].toLowerCase();


                }
                if(i==0){
                    table.appendChild(keyRow);
				}

                table.appendChild(valueRow);
			}

            if(res[i]["parentData"]){
            	for(let j=0; j<res[i]["parentData"].length;j++){
                    let keyRow= document.createElement("tr");
                    if(j==0){
                        keyRow.setAttribute("class","key parentData off "+i+"childData");
					}

                    let valueRow= document.createElement("tr");
                    valueRow.setAttribute("class","value parentData off "+i+"childData");
                    for(key in res[i]["parentData"][j]["dataMap"]){
                    	if(j==0){
                            let item0= document.createElement("td");
                            item0.innerHTML = key;
                            keyRow.appendChild(item0);
						}
                        let item1= document.createElement("td");
                        item1.innerHTML = res[i]["parentData"][j]["dataMap"][key];
                        valueRow.appendChild(item1);

						dataSearchMap[i+"childData"] =dataSearchMap[i+"childData"]+ ";"+ res[i]["parentData"][j]["dataMap"][key].toLowerCase();

                    }
                    if(j==0){
                        table.appendChild(keyRow);
					}
                    table.appendChild(valueRow);
				}

            }

		}
		document.querySelector("#upload-file-form").appendChild(table);
		console.log(dataSearchMap);
	}
}


/* Build Pagenation */

function buildPagenation(res, pageNum) {
    $('table').remove();
    $('#pageDiv').remove();
	//pageNum = 1;
    if(res){
        let table= document.createElement("table");
        let pageDiv= document.createElement("div");
        pageDiv.setAttribute("id","pageDiv");
        let pages =Math.ceil(res.length/10);
        for(let i=0; i<pages;i++){
            let s = document.createElement("span");
            s.innerHTML = (i+1);
            if(s.innerHTML==pageNum){
                s.setAttribute("class","selected");
			}
            pageDiv.appendChild(s);
        }

		let num = (pageNum-1)*10;
        for(let i=num; i<res.length&&i<num+10;i++){
            if(res[i]["childData"]){
                let keyRow= document.createElement("tr");
                if(i==num){
                    keyRow.setAttribute("class","key childData");
                }

                let valueRow= document.createElement("tr");
                valueRow.setAttribute("class","value childData");
                if(res[i]["parentData"]){
                    valueRow.classList.add("hasParentData");
                }
                valueRow.setAttribute("id", i+"childData");


                for(key in res[i]["childData"]["dataMap"]){
                    if(i==num){
                        let item0= document.createElement("td");
                        item0.innerHTML = key;
                        keyRow.appendChild(item0);
                    }

                    let item1= document.createElement("td");
                    item1.innerHTML = res[i]["childData"]["dataMap"][key];
                    valueRow.appendChild(item1);

                }
                if(i==num){
                    table.appendChild(keyRow);
                }

                table.appendChild(valueRow);
            }

            if(res[i]["parentData"]){
                for(let j=0; j<res[i]["parentData"].length;j++){
                    let keyRow= document.createElement("tr");
                    if(j==0){
                        keyRow.setAttribute("class","key parentData off "+i+"childData");
                    }

                    let valueRow= document.createElement("tr");
                    valueRow.setAttribute("class","value parentData off "+i+"childData");
                    for(key in res[i]["parentData"][j]["dataMap"]){
                        if(j==0){
                            let item0= document.createElement("td");
                            item0.innerHTML = key;
                            keyRow.appendChild(item0);
                        }
                        let item1= document.createElement("td");
                        item1.innerHTML = res[i]["parentData"][j]["dataMap"][key];
                        valueRow.appendChild(item1);

                    }
                    if(j==0){
                        table.appendChild(keyRow);
                    }
                    table.appendChild(valueRow);
                }

            }

        }
        document.querySelector("#upload-file-form").appendChild(pageDiv);
        document.querySelector("#upload-file-form").appendChild(table);

    }
}