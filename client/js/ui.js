"use strict";
//main user interface interactions
function Ui(aBody, aStatusBar, aSpecialReportArea, aStateArea, anInputField, anInputArea, aninteractionArea, anEventArea, aConsoleArea, anImageArea) {
    try{
	    var self = this; //closure so we don't lose reference in callbacks
	    var objectName = "Ui";
        var body = aBody;
        var console = aConsoleArea;
        var statusBar = aStatusBar;
        var specialReport = aSpecialReportArea;
        var state = aStateArea;
        var events = anEventArea;
        var image = anImageArea;
        var input = anInputField;
        var inputArea = anInputArea;
        var inputHistory = [];
        var inputHistoryIndex = 0;
        var interaction = aninteractionArea;

        var _lastImageURL = ""; //primitive hack to ensure image doesn't reload every move unless it's actually changed.

        //console.append(objectName+" Initiated<br>");
    //end try
    }
    catch(err) {
	    alert('Unable to create Ui object: '+err);
    };	
    
    //main UI input listener
    Ui.prototype.getConsole = function() {
        return console;
    };

     Ui.prototype.isMobile = function() { 
        return window.matchMedia("(pointer: coarse)").matches && window.innerWidth <= 768;
    };
    
    Ui.prototype.hideMobileKeyboard = function() {
        //hack to hide keyboard on mobile devices. Add element, set focus to it, then remove it again.
        //do not return focus to normal input element (as is done on desktop)
        var field = document.createElement('input');
            field.setAttribute('type', 'text');
            field.style.display = 'block';
            document.body.appendChild(field);

            setTimeout(function() {
                field.focus();
                setTimeout(function() {
                    field.style.display = 'none';
                }, 50);
                document.body.removeChild(field);
                //field.remove();
            }, 50);
    };

    //interaction with client
    Ui.prototype.setState = function (stateData) {
        if (state.text() != "") {
            if (interaction.text() != "") {
                interaction.append('<hr>');
            };
            interaction.append(state.html() + '<br>' + '>' + input.val() + "<br>");
        };

        //console.append('setting state: '+stateData);
        state.html(stateData);

        //console.append("scrolltop:"+interactionScrollTop+"height: "+interaction[0].scrollHeight);
        interaction.scrollTop(interaction[0].scrollHeight);

        input.val("");
        //re-enable input. 
        //we check this state on the keyboard input listener to prevent repeated keypresses if server response is slow
        input.disabled = false;

        if(self.isMobile()) {
            self.hideMobileKeyboard();
        } else {
            input.focus();
        };
    };

    Ui.prototype.setStatus = function(attributes, oldAttributes) {
        /*attributes are returned to here from player.getClientAttributes
        Current supported attributes are:
        "location":"'+_currentLocation.getDisplayName()+'"';
        "injuriesReceived":'+_injuriesReceived;
        "aggression":'+self.getAggression();
        "hp":'+_hitPoints;
        */

        let money = 0;
        let score = 0;
        let health;
        let fed = 0;
        let watered = 0;
        let rested = 0;
        let time;
        let location = "";

        //default emoji
        const scoreEmoji = '<span class="emoji" title="Score"> &#127919;</span>';
        let heartEmoji = '<span class="emoji" title="Health"> &#129293;</span>';
        let foodEmoji = '<span class="emoji" title="Food"> &#127829;</span>';
        let drinkEmoji = '<span class="emoji" title="Drink"> &#129371;</span>';
        let sleepEmoji = '<span class="emoji" title="Rest"> &#128164;</span>';
        const cashEmoji = '<span class="emoji" title="Money"> &#128176;</span>';
        const timeEmoji = '<span class="emoji"title="Time"> &#128337;</span>';

        //define emoji colour filters based on values
        /*
        .brightGreenFilter
        .darkGreenFilter
        .brightYellowFilter
        .amberFilter
        .brightRedFilter
        .darkRedFilter
        */
        let filterColour = "";
        Ui.prototype.colourMap = function(value) {
            let colourClass = "";
            if (value >=90) {colourClass = "no";}  //no filter when mostly full
            else if (value >80) {colourClass = "darkGreen";}          
            else if (value >60) {colourClass = "brightGreen";}
            else if (value >40) {colourClass = "brightYellow";}
            else if (value >30) {colourClass = "amber";}
            else if (value >15) {colourClass = "brightRed";}
            else {colourClass = "darkRed"}

            return colourClass+"Filter";
        };

        var contagion = "";
        if (attributes != "" && attributes != undefined){
            if (attributes.location) {
                location = attributes.location;
            };
            if (attributes.money) {
                money = attributes.money;
            };

            if (attributes.score) {
                score = attributes.score;
            };
            if (!score) {score = 0;};

            /*
            if (attributes.contagion) {
            contagion = attributes.contagion;
                //if there's active contagion...
                if (contagion) {
                    contagion = " <i><b>Contagion Report:</b></i><br>"+contagion;
                    specialReport.addClass("softBorder");  
                    specialReport.html(contagion);
                } else { 
                    specialReport.html("");
                    specialReport.removeClass("softBorder");  
                };
            } else { 
                specialReport.html("");
                specialReport.removeClass("softBorder");  
            };*/

            if (attributes.bleeding) {
                self.bleed(true);
            } else {
                self.bleed(false);
            };

            if (attributes.health) {
                health = attributes.health;
                filterColour = self.colourMap(health); 
                heartEmoji = '<span class="emoji '+filterColour+'" title="Health"> &#129293;</span>';
            };
            if (attributes.fed) {
                fed = attributes.fed;
                filterColour = self.colourMap(fed);
                foodEmoji = '<span class="emoji '+filterColour+'" title="Food"> &#127829;</span>';
        
            };            
            if (attributes.watered) {
                watered = attributes.watered;
                filterColour = self.colourMap(watered);
                drinkEmoji = '<span class="emoji '+filterColour+'" title="Drink"> &#129371;</span>';
            };
            if (attributes.rested) {
                rested = attributes.rested;
                filterColour = self.colourMap(rested);
                sleepEmoji = '<span class="emoji '+filterColour+'" title="Rest"> &#128164;</span>';
            };
            if (attributes.time) {
                time = attributes.time;
            };

            if (attributes.injuriesReceived > oldAttributes.injuriesReceived) {
                var hitCount = attributes.injuriesReceived - oldAttributes.injuriesReceived;
                self.hit(hitCount, attributes.bleeding);
            };

            if (attributes.score != oldAttributes.score || attributes.money != oldAttributes.money) {
                self.flashStats(attributes.bleeding);
            };


        };
        
        money = money.toFixed(2);

        //const locationEmoji = '<span class="emoji" title="Location"> &#129517;</span>';
        const stats = '<span class="health">'+heartEmoji+health+'</span><span class="food">'+foodEmoji+fed+'</span><span class="drink">'+drinkEmoji+watered+'</span><span class="sleep">'+sleepEmoji+rested+'</span>';
        statusBar.html('<span class="score">'+scoreEmoji+score+'</span>'+stats+'<span class="money">'+cashEmoji+money+'</span><span class="time">'+timeEmoji+time+'</span>');//<span class="location">'+locationEmoji+location+'</span>');
    };

    Ui.prototype.setEvent = function(eventData) {
        events.append(eventData+'<br>');
    };

    Ui.prototype.listenForInput = function(callback) {
            input.keyup(function(e){
                //we disable input when awaiting a callback server response. We also need to ignore keystrokes
                if (input.disabled) {return null;} 
    	    	var keycode = e.which;
                if (keycode ==38) {//up arrow
                    input.val(inputHistory[inputHistoryIndex]);
                    if (inputHistoryIndex >0) {inputHistoryIndex--;}
                    input.focus();
                };
                if (keycode ==40) {//down arrow
                    input.val(inputHistory[inputHistoryIndex]);
                    if (inputHistoryIndex < inputHistory.length) {inputHistoryIndex++;}
                    input.focus();
                };
                if(keycode==13) {//enter
                    inputHistory.push(input.val());
                    inputHistoryIndex = inputHistory.length-1;

                    var callbackValue = input.val();
                    input.disabled = true;

                    if (callback && typeof(callback) === "function") {
                        callback(callbackValue);
                    } else { 
                        alert('Unexpected callback object type in UI: '+typeof(callback));
                    };
    		    };
            });
    };


    Ui.prototype.setImage = function(imageData) {
        if (imageData.substring(0,imageData.lastIndexOf("/")) == _lastImageURL) {return true;};
        _lastImageURL = imageData.substring(0,imageData.lastIndexOf("/"));
        var img = new Image();
        img.src = imageData+".jpg"; //the extra suffix tells the browser it's a jpg image file (needs help!)
        img.onload = function(){
            // image  has been loaded
        };    
        self.cssFadeIn(image);
        self.cssBoxNarrow(interaction);
        image.addClass("softBorder");    
        image.html(img);
    };

    Ui.prototype.clearImage = function() {
        _lastImageURL = "";
        self.cssFadeOut(image); 
        self.cssBoxNormal(interaction);
        setTimeout(function() {
            image.removeClass("softBorder");   
            image.html("");
        },200);
    };

    Ui.prototype.bleed = function(bleedBool) {
        if (bleedBool) {
            //state.style.backgroundColor = "#990000"; 
            state.css('background-color','#220000');
            interaction.css('background-color','#220000');
            input.css('background-color','#220000');
            inputArea.css('background-color','#220000');
            statusBar.css('background-color','#220000');
        } else {
            //state.style.backgroundColor = "black"; 
            state.css('background-color','black');
            interaction.css('background-color','black');
            input.css('background-color','black');
            inputArea.css('background-color','black');
            statusBar.css('background-color','black');
        };
    };

    Ui.prototype.flashStats = function(bleedBool) {
        var flashColour = '#000088';
        var originalColour = 'black';
        if (bleedBool) {
            originalColour = '#220000';
        };

        //flash ui elements
        statusBar.css('background-color',flashColour);
        statusBar.css('color','white');
        setTimeout(function(){               
            statusBar.css('background-color',originalColour);
            statusBar.css('color','#00DD00');
        }, 500);

    };

    Ui.prototype.hit = function(hitCount, bleedBool) {
        var flashColour = '#550000';
        var originalColour = 'black';
        if (bleedBool) {
            flashColour = '#CC0000'
            originalColour = '#220000';
        };
        for (var i=0;i<hitCount;i++) {
            self.cssFlash(flashColour,originalColour);
        };
    };

    Ui.prototype.cssFlash = function(flashColour, originalColour) {
            //flash ui elements
            state.css('background-color',flashColour);
            interaction.css('background-color',flashColour);
            input.css('background-color',flashColour);
            inputArea.css('background-color',flashColour);
            statusBar.css('background-color',flashColour);
            body.css('color','white');
            setTimeout(function(){               
                state.css('background-color',originalColour);
                interaction.css('background-color',originalColour);
                input.css('background-color',originalColour);
                inputArea.css('background-color',originalColour);
                statusBar.css('background-color',originalColour);
                body.css('color','#00DD00');
            }, 75);
    };

    Ui.prototype.cssFadeIn = function(element) {
        element.addClass("fadeIn");
        element.removeClass("fadeOut");
    };
        
    Ui.prototype.cssFadeOut = function(element) {
        element.addClass("fadeOut");
        element.removeClass("fadeIn");
    };

    Ui.prototype.cssBoxNarrow = function(element) {
        element.addClass("boxNarrow");
        element.removeClass("boxNormal");
    };

    Ui.prototype.cssBoxNormal = function(element) {
        element.addClass("boxNormal");
        element.removeClass("boxNarrow");
    };
};
