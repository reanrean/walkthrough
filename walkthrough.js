$(document).ready(function () {
	wt_init();
});

var rmList={};
var cutList={};

function wt_init(){
	$('#wt_options').html('');
	$('#wt_options').append(wt_button('编辑','wt_gen()'));
	$('#wt_options').append(wt_button('查看','wt_result()'));
	$('#wt_options2').html('');
	$('#wt_options2').append('分数：'+selectBox('wt_showScore','return false;',[0,1,2],['无','上下装','上下装+饰品']));
	$('#wt_options2').append('<br>来源：'+selectBox('wt_showSrc','return false;',[0,1,2],['无','简略','上下装+饰品']));
	$('#wt_options2').append('<br>显示<output id="rescnt" style="display:inline">4</output>件');
	$('#wt_options2').append(wt_button('＋','wt_addrescnt()'));
	$('#wt_options2').append(wt_button('－','wt_minrescnt()'));
}

function wt_gen(){
	$('#wt_editor').html('');
	$('#wt_editor').show();
	$('#wt_options2').show();
	$('#wt_result').hide();
	for (var c in category){
		$('#wt_editor').append('<p id="wt_editor_'+c+'">'+category[c]+'：</p>');
		wt_regen(category[c]);
	}
}

function wt_result(){
	$('#wt_result').html('');
	$('#wt_editor').hide();
	$('#wt_options2').hide();
	$('#wt_result').show();
	for (var c in category){
		$('#wt_result').append('<p id="wt_result_'+c+'">'+category[c]+'：</p>');
		wt_regen_res(category[c]);
	}
}

function wt_rm(id,cateName){
	var currTheme = $("#theme").val();
	if(!rmList[currTheme]) {rmList[currTheme]=[]};
	rmList[currTheme].push(cateName+id);
	rmList[currTheme]=getDistinct(rmList[currTheme]);
	wt_regen(cateName);
}

function wt_cut(id,cateName){
	var currTheme = $("#theme").val();
	if(!cutList[currTheme]) {cutList[currTheme]={}};
	cutList[currTheme][cateName]=id;
	wt_regen(cateName);
}

function wt_uncut(id,cateName){
	var currTheme = $("#theme").val();
	if(!cutList[currTheme]) {cutList[currTheme]={}};
	cutList[currTheme][cateName]=-1;
	wt_regen(cateName);
}

function wt_regen_res(cate){
	var result=getTopCloByCate(criteria,$("#rescnt").val(),cate);
	var editor_num=-1;
	for (var c in category){
		if(category[c]==cate) {editor_num=c; break;}
	}
	$('#wt_result_'+editor_num).html(cate+'：');
	for(var r in result){
		if(r>0){
			if(result[r].sumScore==result[r-1].sumScore) {$('#wt_result_'+editor_num).append(' = ');}
			else {$('#wt_result_'+editor_num).append(' > ');}
		}
		$('#wt_result_'+editor_num).append(result[r].name);
	}
}

function wt_regen(cate){
	var result=getTopCloByCate(criteria,$("#rescnt").val(),cate);
	var editor_num=-1;
	for (var c in category){
		if(category[c]==cate) {editor_num=c; break;}
	}
	$('#wt_editor_'+editor_num).html(cate+'：');
	for(var r in result){
		if(r>0){
			if(result[r].sumScore==result[r-1].sumScore) {$('#wt_editor_'+editor_num).append(' = ');}
			else {$('#wt_editor_'+editor_num).append(' > ');}
		}
		var item=wt_ahref('[×]','wt_rm('+parseInt(result[r].id)+",'"+category[c]+"'"+')')+result[r].name+result[r].sumScore;
		if(cutList[criteria.levelName]&&cutList[criteria.levelName][cate]&&cutList[criteria.levelName][cate]==parseInt(result[r].id)) {
			item+=wt_ahref('[▽]','wt_uncut('+parseInt(result[r].id)+",'"+category[c]+"'"+')');
		}else {item+=wt_ahref('[△]','wt_cut('+parseInt(result[r].id)+",'"+category[c]+"'"+')');}
		$('#wt_editor_'+editor_num).append(wt_button(item,'return false;',result[r].source));
	}
}

function getTopCloByCate(filters,rescnt,type){
	var result = [];
	for (var i in clothes) {
		if (clothes[i].type.type!=type){continue;}//skip other categories
		if ($.inArray((clothes[i].type.type+parseInt(clothes[i].id)),rmList[criteria.levelName])>-1) {continue;}//skip clothes marked rm
		clothes[i].calc(filters);
		if (clothes[i].isF||clothes[i].sumScore<=0) {continue;}
		if (!result[0]) {
			result[0] = clothes[i];
		}else {
			if(result[rescnt-1] && clothes[i].sumScore < result[rescnt-1].sumScore){
				//do nothing
			}else if(result[rescnt-1] && clothes[i].sumScore == result[rescnt-1].sumScore){
				result.push(clothes[i]);//push to end
			}else{
				for (j=0;j<rescnt;j++){//compare with [j]
					if(!result[j] || clothes[i].sumScore > result[j].sumScore){
						if (result[rescnt-1]&&result[rescnt-2]){
							if (result[rescnt-1].sumScore == result[rescnt-2].sumScore){//insert into list
								for (k=result.length;k>j;k--){//lower others ranking
									result[k] = result[k-1];
								}
								//put current clothes to [j]
								result[j] = clothes[i];
								break;
							}else{//create new list
								var result_orig=result;
								result=[];
								for(r=0;r<j;r++){
									result[r]=result_orig[r];
								}
								for (k=rescnt-1;k>j;k--){//lower others ranking
									result[k] = result_orig[k-1];
								}
								result[j]=clothes[i];
								break;
							}
						}else if(rescnt==1){//create new list with only 1 element
							result=[];
							result[j] = clothes[i];
						}else{
							for (k=rescnt-1;k>j;k--){//lower others ranking
								if(result[k-1]) {result[k] = result[k-1];}
							}
							//put current clothes to [j]
							result[j] = clothes[i];
							break;
						}
					}
				}
			}
		}
	}
	if (cutList[criteria.levelName]&&cutList[criteria.levelName][type]){
		var result_cut=[];
		for (var r in result){
			result_cut.push(result[r]);
			if(parseInt(result[r].id)==cutList[criteria.levelName][type]){break;}
		}
		return result_cut;
	}
	
	return result;
}

function getDistinct(arr){
	var newArr=[];
	for (var i in arr){
		var ind=0;
		for (var j in newArr){
			if (arr[i]==newArr[j]) {ind=1;}
		}
		if(ind==0) {newArr.push(arr[i])};
	}
	return newArr;
}

function wt_ahref(text,onclick,cls){
	return '<a href="" onclick="'+onclick+';return false;" '+(cls? 'class="'+cls+'" ' : '')+'>'+text+'</a>';
}
function wt_button(text,onclick,title){
	return '<button type="button" class="btn btn-xs btn-default" onclick="'+onclick+'"'+(title?' alt="'+title+'"':'')+'>'+text+'</button>';
}
function selectBox(id,onchange,valArr,textArr){
	var ret='<select id="'+id+'" onchange='+onchange+'>';
	if(!textArr){textArr=valArr;}
	for (var i in valArr){
		ret+='<option value="'+valArr[i]+'">'+textArr[i]+'</option>';
	}
	ret+='</select>';;
	return ret;
}
