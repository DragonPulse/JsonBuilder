/**
 * Created by hea on 4/03/18.
 */
$(document)
		.ready(
				function() {

					$("#btnUploadParent").click(function() {
						readHeader("parentFile");
					});

					$("#btnUploadChild").click(function() {
						readHeader("childFile");
					});

					$("#btnMatchFiles").click(function() {
						uploadBothFile();
					});

					$('#requireUniqueCode').change(function(e) {
						$("#addUniqueCodeDiv").fadeToggle();
					});

					$("#upload-parentfile-input").change(
							function(e) {
								$("label[for='upload-parentfile-input']").text(
										e.target.files[0].name);
							});

					$("#requireGroup").change(function(e) {
						$("#addGroupDiv").fadeToggle();
						$("#groupDiv").fadeToggle();
					});
					$("#groupSubmit")
							.click(
									function(e) {
										e.preventDefault();
										let result = generateGroupResultJson();
										result.ungroup = getUngroupJson();
										// result will be upload to server
										console.log(result);
										var templateDesign = result;
										var templateName = $("#templateName")
												.val();
										var locale = $("#locale").val();
										var form;
										form = new FormData();
										form
												.append(
														"uploadfile",
														document
																.getElementById('upload-parentfile-input').files[0]);
										form.append("locale", $("#locale")
												.val());
										form.append("templateName", $(
												"#templateName").val());
										form.append("uniqueCode", $(
												"#uniqueCode").val());
										form
												.append(
														"templateDesign",
														JSON
																.stringify(generateGroupResultJson()));
										$
												.ajax({
													url : "/buildJsonData",
													type : "POST",
													data : form,
													enctype : 'multipart/form-data',
													processData : false,
													contentType : false,
													cache : false,
													success : function(data) {
														var options = [];
														options
																.push('<option>-- Select Column header  --</option>');

														$
																.each(
																		data,
																		function(
																				i,
																				item) {
																			options
																					.push($(
																							'<option/>',
																							{
																								value : item,
																								text : item
																							}));
																			$(
																					"#columnsList")
																					.append(
																							'<li id="'
																									+ item
																									+ '" class ="ion-edit" draggable="true" ondragstart="drag(event)" onclick="handleClickSelect(event)">'
																									+ i
																									+ '.'
																									+ item
																									+ '<span style="color: #5cb85c" class="ion-arrow-move"></span></li>');
																		});

														if (fileType == "parentFile") {
															// $('#columnHeaderParent').html('');
															// // Set the
															// Dropdown as Blank
															// before new Data
															// $('#columnHeaderParent').append(options);
														} else {
															$(
																	'#columnHeaderChild')
																	.html(''); // Set
																				// the
																				// Dropdown
																				// as
																				// Blank
																				// before
																				// new
																				// Data
															$(
																	'#columnHeaderChild')
																	.append(
																			options);
														}

													},
													error : function() {
														// Handle upload error
														// ...
													}
												});

									});

					$("input:not(#groupName)")
							.on(
									'keydown',
									function(e) {
										if (e.which === 13) {
											e.preventDefault();
											if (e.target.getAttribute("id") === "displayValue") {
												handleFormClose();
											}
										}

									});

					$("#groupDiv>.itemGroup>h2>span").click(function(e) {
						e.preventDefault();
					});

					$(document).on('click', '.childData', function() {
						// console.log(this);
						let id = $(this).attr('id');
						$('.' + id).toggleClass('off');
						$(this).toggleClass('on');
					});

					$("#groupName")
							.on(
									'keydown',
									function(e) {
										if (e.which === 13) {
											e.preventDefault();
											if (e.target.value.length > 0) {
												var selectedItem = document
														.querySelectorAll("#columnsList li.selected");
												var newGroup = $("<div id='"
														+ e.target.value
														+ "' class='itemGroup' draggable='true' ondrop='drop(event)' ondragover='allowDrop(event)' ondragstart='drag(event)'><h2 class='ion-edit' contenteditable='true'>"
														+ e.target.value
														+ "</h2><span class='ion-minus-circled' onclick='handleMin(event)'></span></div>");
												if (selectedItem.length > 0) {
													for (let i = 0; i < selectedItem.length; i++) {
														newGroup
																.append($(selectedItem[i]));
													}
												}

												$("#groupDiv").append(newGroup);
												e.target.value = "";
											}
										}
									})
				});

function handleClickSelect(e) {
	$(e.target).toggleClass('selected');
	var container = document.getElementById("groupDiv");
	if (isDescendant(container, e.target)) {
		console.log('enable display property!');
		var targetId = e.target.id;
		$('#displayPopup>h2').text(targetId);
		if (e.target.dataset.display) {
			$('#displayValue').val(e.target.dataset.display);
		} else {
			$('#displayValue').val('');
		}
		$('#displayPopup').fadeIn();
	}
}

function handleFormClose(e) {
	document.querySelector('#' + $('#displayPopup>h2').text()).dataset.display = $(
			'#displayValue').val();
	$('#displayPopup').fadeOut();
}

function handleMin(e) {
	if (e.target.classList.contains('ion-minus-circled')) {
		getMostCloseParentElementWithOnDrop(e.target).classList.add("hid");
		e.target.classList.remove('ion-minus-circled');
		e.target.classList.add('ion-arrow-expand');
	} else {
		getMostCloseParentElementWithOnDrop(e.target).classList.remove("hid");
		e.target.classList.remove('ion-arrow-expand');
		e.target.classList.add('ion-minus-circled');
	}

	// console.log(getMostCloseParentElementWithOnDrop(e.target));
}

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
	// console.log(data);
	// console.log(isDescendant(document.getElementById("groupDiv"),e.target));
	// console.log(getMostCloseParentElementWithOnDrop(e.target));
	var container = document.getElementById("groupDiv");

	if (isDescendant(container, e.target)) {
		var p = getMostCloseParentElementWithOnDrop(e.target);
		if (p === container && child.nodeName === "LI") {
			alert("Please put in a group!");
		} else {
			p.appendChild(child);
		}

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
	while (!element.hasAttribute('ondrop')) {
		element = element.parentElement;
	}
	return element;
}

function generateGroupResultJson(element) {
	if (element === null || element === undefined) {
		element = document.querySelector("#groupDiv");
	}
	let array = element.children;
	let result = {};
	// console.log(array);
	for (let i = 0; i < array.length; i++) {
		if (array[i].nodeName === "DIV") {
			result[array[i].children[0].innerHTML] = generateGroupResultJson(array[i]);
		} else if (array[i].nodeName === "LI") {
			if(array[i].dataset.display=="undefined" || array[i].dataset.display == null){
				result[array[i].getAttribute("id")] ='{{'+array[i].getAttribute("id")+'}}';
				//result[array[i].getAttribute("id")] = "{{"array[i].getAttribute("id")"}}";
			}else{
				result[array[i].dataset.display] = '{{'+array[i].getAttribute("id")+'}}';
				//result[array[i].getAttribute("id")] = array[i].dataset.display||"NO";
			}
			
		}
	}
	// console.log(result);
	return result;
}

function getUngroupJson() {
	let ungroupList = document.querySelectorAll("#columnsList>li");
	let list = [];
	for (let i = 0; i < ungroupList.length; i++) {
		list.push(ungroupList[i].getAttribute("id"));
	}
	return list;
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
	// form.append("parentColumn", $('#columnHeaderParent').val());
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
			serviceRes = data;

			let p = new Promise(function(resolve, reject) {
				buildTable(data);
				// buildPagenation(data,1);
				resolve("success");
			});
			p.then(function() {
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
	$
			.ajax({
				url : url,
				type : "POST",
				data : form,
				enctype : 'multipart/form-data',
				processData : false,
				contentType : false,
				cache : false,
				success : function(data) {
					var options = [];
					options
							.push('<option>-- Select Column header  --</option>');

					$
							.each(
									data,
									function(i, item) {
										options.push($('<option/>', {
											value : item,
											text : item
										}));
										$("#columnsList")
												.append(
														'<li id="'
																+ item
																+ '" class ="ion-edit" draggable="true" ondragstart="drag(event)" onclick="handleClickSelect(event)">'
																+ i
																+ '.'
																+ item
																+ '<span style="color: #5cb85c" class="ion-arrow-move"></span></li>');
									});

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

