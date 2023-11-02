var inputType = "local";
var stepped = 0, rowCount = 0, errorCount = 0, firstError;
var start, end;
var firstRun = true;
var maxUnparseLength = 10000;

var includedColumns = [0, 2, 4];

var columnClasses = {
    0: '<div class="badge bg-primary fw-bold"></div>',
    2: '<p class="fs-2"></p>',
    4: '<p class="text-uppercase"></p>'
};


$(function () {

    // loading script invoked
    $('#submit').click(function () {
        if ($(this).prop('disabled') == "true")
            return;

        stepped = 0;
        rowCount = 0;
        errorCount = 0;
        firstError = undefined;

        var config = buildConfig();
        var input = $('#input').val();

        if (inputType == "remote")
            input = $('#url').val();
        else if (inputType == "json")
            input = $('#json').val();

        // Allow only one parse at a time
        $(this).prop('disabled', true);

        if (!firstRun)
            console.log("--------------------------------------------------");
        else
            firstRun = false;

        if (!$('#files')[0].files.length) {
            alert("Please choose at least one file to parse.");
            return enableButton();
        }

        $('#files').parse({
            config: config,
            before: function (file, inputElem) {
                start = now();
                console.log("Parsing file...", file);
            },
            error: function (err, file) {
                console.log("ERROR:", err, file);
                firstError = firstError || err;
                errorCount++;
            },
            complete: function () {
                end = now();
                printStats("Done with all files");
            }
        });

        $('.initial-form').hide();
        // $('.generated-document').show();

    });

    $('#insert-tab').click(function () {
        $('#delimiter').val('\t');
    });
});




function printStats(msg) {
    if (msg)
        console.log(msg);
    console.log("       Time:", (end - start || "(Unknown; your browser does not support the Performance API)"), "ms");
    console.log("  Row count:", rowCount);
    if (stepped)
        console.log("    Stepped:", stepped);
    console.log("     Errors:", errorCount);
    if (errorCount)
        console.log("First error:", firstError);
}



function buildConfig() {
    return {
        delimiter: $('#delimiter').val(),
        header: $('#header').prop('checked'),
        dynamicTyping: $('#dynamicTyping').prop('checked'),
        skipEmptyLines: $('#skipEmptyLines').prop('checked'),
        preview: parseInt($('#preview').val() || 0),
        step: $('#stream').prop('checked') ? stepFn : undefined,
        encoding: $('#encoding').val(),
        worker: $('#worker').prop('checked'),
        comments: $('#comments').val(),
        complete: completeFn,
        error: errorFn,
        download: inputType == "remote"
    };
}

function stepFn(results, parser) {
    stepped++;
    if (results) {
        if (results.data)
            rowCount += results.data.length;
        if (results.errors) {
            errorCount += results.errors.length;
            firstError = firstError || results.errors[0];
        }
    }
}

function completeFn(results) {
    end = now();

    if (results && results.errors) {
        if (results.errors) {
            errorCount = results.errors.length;
            firstError = results.errors[0];
        }
        if (results.data && results.data.length > 0)
            rowCount = results.data.length;
    }

    printStats("Parse complete");
    console.log("Results:", results);

    // Display the parsing results in the #generated-document div
    // $('#generated-document').html(JSON.stringify(results.data, null, 2)); // Convert results to a JSON string for display

    // $('#generated-document ul.list-group').empty();

    // Display the parsing results in the #generated-document div as a Bootstrap list group
    // if (results && results.data) {
    //     results.data.forEach(function (row, rowIndex) {
    //         var listItem = $('<li class="list-group-item"></li>').text(row.join(', '));
    //         $('#generated-document ul.list-group').append(listItem);
    //     });
    // }

    // Clear the #generated-document div
    $('#generated-document').empty();

    // Invoke the generateDocument function to display the data elements
    if (results && results.data) {
        // Skip the first row (header)
        results.data.slice(1).forEach(function (row, rowIndex) {
            var headerRow = results.data[0]; // Get the header row
            generateDocument(row, headerRow);
        });
    }

    // icky hack
    setTimeout(enableButton, 100);
}


function errorFn(err, file) {
    end = now();
    console.log("ERROR:", err, file);
    enableButton();
}

function enableButton() {
    $('#submit').prop('disabled', false);
}

function now() {
    return typeof window.performance !== 'undefined'
        ? window.performance.now()
        : 0;
}

// Create a separate function to generate and display data elements
function generateDocument(row, headerRow) {
    var dataDiv = $('<div class="data-element border p-2 mb-3"></div>'); // Create a div for each data element with a border

    // Iterate through the included columns and display them
    includedColumns.forEach(function (columnIndex) {
        var header = headerRow[columnIndex];
        var data = row[columnIndex];
        var element = $(columnClasses[columnIndex])
            .html(header + ': ' + data); // Insert data into the HTML element
        dataDiv.append(element);
    });

    $('#generated-document').append(dataDiv); // Append the data div to the #generated-document div
}

// Create a function to display errors as the first element
function displayError(error) {
    var errorDiv = $('<div class="data-element border p-2 mb-3 text-danger"></div>'); // Create a div for the error with a border and text-danger class
    var errorElement = $('<p></p>').text("Error: " + error.message); // Wrap error message in <p> tag
    errorDiv.append(errorElement);
    $('#generated-document').append(errorDiv); // Append the error div to the #generated-document div
}