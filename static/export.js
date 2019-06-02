$(document).ready(function()
{
		
})
function try1()
{
		console.log("yo");
		var wb = XLSX.utils.book_new();
		wb.SheetNames.push("Test Sheet");
		//var ws_data = [['hello','world']];
		var ws_data = [{ name : "vijjuvijjuvijjuvijju", age : 22, class : "higher"},{ name : "yash",age : 24}];
		var obj = ws_data[0];
		console.log("ws_data length : "+Object.keys(obj).length);
		var ws = XLSX.utils.json_to_sheet(ws_data);
		wb.Sheets["Test Sheet"] = ws;
		var wscols = [];
		for(var i=0;i<Object.keys(obj).length;i++)
		{
			wscols.push({wch : 50});
		}
		/*var wscols = [
					    {wch:20},
					    {wch:20},
					    {wch:10},
					    {wch:20}
					];

		ws['!cols'] = wscols;*/
		ws['!cols'] = wscols;

		var wbout = XLSX.write(wb, {bookType:'xlsx',  type: 'binary'});
		function s2ab(s) { 
                var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
                var view = new Uint8Array(buf);  //create uint8array as viewer
                for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
                return buf;    
		}

		 saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'test.xlsx');

}
