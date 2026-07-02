var dropdown_data = [];
var position = -1;
var record_id = "";
var find_clicked = false;


window.onload = function()
{
    get_dropdown_data();

    document.getElementById("fieldName").value = "";
    document.getElementById("optionValue").value = "";
    document.getElementById("status").value = "";

    document.getElementById("fieldMsg").innerHTML = "";
    document.getElementById("optionMsg").innerHTML = "";
    document.getElementById("statusMsg").innerHTML = "";
    document.getElementById("msg").innerHTML = "";

    document.getElementById("modeButton").innerHTML = "Find";
    document.getElementById("saveBtn").innerHTML = "Save";

    document.getElementById("fieldName").oninput = function()
    {
        var field_name = document.getElementById("fieldName").value.trim();

        document.getElementById("fieldMsg").innerHTML = "";

        if(field_name != "")
        {
            var first = field_name.charAt(0);

            if(first >= "a" && first <= "z")
            {
                document.getElementById("fieldMsg").innerHTML = "First letter should be capital";
                return;
            }
        }

        if(find_clicked == true && record_id == "")
        {
            position = -1;
            search_record();
        }
    }

    document.getElementById("optionValue").oninput = function()
    {
        var option_value = document.getElementById("optionValue").value.trim();

        document.getElementById("optionMsg").innerHTML = "";

        if(option_value != "")
        {
            var first = option_value.charAt(0);

            if(first >= "a" && first <= "z")
            {
                document.getElementById("optionMsg").innerHTML = "First letter should be capital";
            }
        }
    }

    document.getElementById("status").oninput = function()
    {
        var status_value = document.getElementById("status").value.trim();

        document.getElementById("statusMsg").innerHTML = "";

        if(status_value != "")
        {
            var first = status_value.charAt(0);

            if(first >= "a" && first <= "z")
            {
                document.getElementById("statusMsg").innerHTML = "First letter should be capital";
            }
        }
    }
}


function mode_change()
{
    var btn_value = document.getElementById("modeButton").innerHTML;

    document.getElementById("fieldName").value = "";
    document.getElementById("optionValue").value = "";
    document.getElementById("status").value = "";

    document.getElementById("fieldMsg").innerHTML = "";
    document.getElementById("optionMsg").innerHTML = "";
    document.getElementById("statusMsg").innerHTML = "";
    document.getElementById("msg").innerHTML = "";

    record_id = "";
    position = -1;

    if(btn_value == "Find")
    {
        find_clicked = true;

        document.getElementById("modeButton").innerHTML = "New";
        document.getElementById("saveBtn").innerHTML = "Update";
    }
    else
    {
        find_clicked = false;

        document.getElementById("modeButton").innerHTML = "Find";
        document.getElementById("saveBtn").innerHTML = "Save";
    }

    document.getElementById("fieldName").focus();
}


function save_data()
{
    var fieldname = document.getElementById("fieldName").value.trim();
    var option_value = document.getElementById("optionValue").value.trim();
    var status_value = document.getElementById("status").value.trim();

    document.getElementById("fieldMsg").innerHTML = "";
    document.getElementById("optionMsg").innerHTML = "";
    document.getElementById("statusMsg").innerHTML = "";
    document.getElementById("msg").innerHTML = "";

    if(fieldname == "")
    {
        document.getElementById("fieldMsg").innerHTML = "Required";
        return;
    }

    if(option_value == "")
    {
        document.getElementById("optionMsg").innerHTML = "Required";
        return;
    }

    if(status_value == "")
    {
        document.getElementById("statusMsg").innerHTML = "Required";
        return;
    }



    var first1 = fieldname.charAt(0);

    if(first1 >= "a" && first1 <= "z")
    {
        document.getElementById("fieldMsg").innerHTML = "First letter should be capital";
        return;
    }
    var first2 = option_value.charAt(0);

    if(first2 >= "a" && first2 <= "z")
    {
        document.getElementById("optionMsg").innerHTML = "First letter should be capital";
        return;
    }

    var first3 = status_value.charAt(0);

    if(first3 >= "a" && first3 <= "z")
    {
        document.getElementById("statusMsg").innerHTML = "First letter should be capital";
        return;
    }

    if(find_clicked == true && record_id == "")
    {
        document.getElementById("msg").style.color = "darkred";
        document.getElementById("msg").innerHTML = "Search record first";
        return;
    }

    var data = {
        id: record_id,
        field_name: fieldname,
        option_value: option_value,
        status: status_value
    };

    fetch("/saveCommonDropdown", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(function(response)
    {
        return response.text();
    })
    .then(function(reply)
    {
        document.getElementById("msg").style.color = "green";
        document.getElementById("msg").innerHTML = reply;

        get_dropdown_data();

        if(find_clicked == false)
        {
            document.getElementById("fieldName").value = "";
            document.getElementById("optionValue").value = "";
            document.getElementById("status").value = "";

            record_id = "";
            position = -1;

            document.getElementById("modeButton").innerHTML = "Find";
            document.getElementById("saveBtn").innerHTML = "Save";
        }
        else
        {
            document.getElementById("saveBtn").innerHTML = "Update";
        }
    })
    .catch(function()
    {
        document.getElementById("msg").style.color = "darkred";
        document.getElementById("msg").innerHTML = "Record not saved";
    });
}



function search_record()
{
    var fieldname = document.getElementById("fieldName").value.trim();

    if(fieldname == "")
    {
        document.getElementById("optionValue").value = "";
        document.getElementById("status").value = "";

        record_id = "";
        position = -1;
        return;
    }


    var found = false;

    for(var i = 0; i < dropdown_data.length; i++)
    {
        if(dropdown_data[i][1] == fieldname)
        {
            position = i;
            record_id = dropdown_data[i][0];
            found = true;
            break;
        }
    }


    if(found == true)
    {
        show_data();
        document.getElementById("msg").innerHTML = "";
    }
    else
    {
        document.getElementById("optionValue").value = "";
        document.getElementById("status").value = "";

        record_id = "";
        position = -1;
    }
}







function next_data()
{
    if(dropdown_data.length == 0)
    {
        document.getElementById("msg").style.color = "darkred";
        document.getElementById("msg").innerHTML = "No next record";
        return;
    }

    if(position == -1)
    {
        position = 0;
    }
    else
    {
        if(position < dropdown_data.length - 1)
        {
            position = position + 1;
        }
        else
        {
            document.getElementById("msg").style.color = "darkred";
            document.getElementById("msg").innerHTML = "No next record";
            return;
        }
    }

    show_data();
    document.getElementById("msg").innerHTML = "";
}


function previous_data()
{
    if(dropdown_data.length == 0)
    {
        document.getElementById("msg").style.color = "darkred";
        document.getElementById("msg").innerHTML = "No previous record";
        return;
    }

    if(position == -1)
    {
        position = dropdown_data.length - 1;
    }
    else
    {
        if(position > 0)
        {
            position = position - 1;
        }
        else
        {
            document.getElementById("msg").style.color = "darkred";
            document.getElementById("msg").innerHTML = "No previous record";
            return;
        }
    }

    show_data();
    document.getElementById("msg").innerHTML = "";
}



function show_data()
{
    if(position < 0)
    {
        return;
    }

    if(position >= dropdown_data.length)
    {
        return;
    }

    record_id = dropdown_data[position][0];

    document.getElementById("fieldName").value = dropdown_data[position][1];
    document.getElementById("optionValue").value = dropdown_data[position][2];
    document.getElementById("status").value = dropdown_data[position][3];

    find_clicked = true;

    document.getElementById("modeButton").innerHTML = "New";
    document.getElementById("saveBtn").innerHTML = "Update";

    document.getElementById("fieldMsg").innerHTML = "";
    document.getElementById("optionMsg").innerHTML = "";
    document.getElementById("statusMsg").innerHTML = "";
}

function get_dropdown_data()
{
    fetch("/getCommonDropdown")
    .then(function(response)
    {
        return response.json();
    })
    .then(function(data)
    {
        dropdown_data = data;
    })
    .catch(function()
    {
        document.getElementById("msg").style.color = "darkred";
        document.getElementById("msg").innerHTML = "Unable to load records";
    });
}




function exit_page()
{
    window.history.back();
}