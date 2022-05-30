const { ipcRenderer } = require('electron');
const fs = require('fs');
const process = require('process');
const {shell} = require('electron');
const { Console } = require('console');
const { title } = require('process');



const pathDesktop = require('path').join(require('os').homedir(), 'Desktop');
var lastPath = undefined;
var currentPath = undefined;
var currentFiles = [];

var fileSelected = null;
var ltcSelected = null;

var songStrings = [];
var lctStrings = [];

var newSongStrings = [];
var newLTCStrings = [];

var groupLimit = 4;
var folderMust1 = 'TESTI';
var folderMust2 = 'LTC';

function checkPathAndSetAsCurrent(event) {
    try{
        pathToCheck = event.target.files[0].path;
    }catch(e){
        console.log(' WARN - probably the folder is empty, if it is not, contact the support team.'+e)
        return false;
    }
    console.log(pathToCheck)
    let absolutePathFound = endsWith(pathToCheck,folderMust1,true);
    if(absolutePathFound){
        lastPath = currentPath; 
        currentPath = absolutePathFound+'\\';
        console.log('lastpath setted:'+lastPath)
        console.log('currentPath setted:'+currentPath)
        if(lastPath != undefined){
            document.getElementById('lastPathDisplay').innerHTML= '<a id="lastPathDisplay">'+lastPath+'</a>'
        }
        document.getElementById('currentPathDisplay').innerHTML= '<a id="currentPathDisplay">'+currentPath+'</a>' 
        return true;
    }else{
        console.log('WARN - path is not a valid path.. -> '+absolutePathFound)

    }
    return false;
}

function setCurrentFiles(){
    var filesTXTFound = [];
    if(currentPath){

        fs.readdir(currentPath, (err, files) => {
            if (err){
                console.log(' ERROR - cant load files ,'+err);
                return;
            } else {
                filesTemp = files;
            }
            if(files){
                for( const file of files) {
                    if(endsWith(file,'.txt',false)){
                        filesTXTFound.push(file);
                    }
                }
                if(filesTXTFound){
                    currentFiles = filesTXTFound;
                    document.getElementById('songs-container').innerHTML= songsContainerBuilder('song-main',currentFiles);
                    for(var i= 0;i<currentFiles.length;i++){
                        let doc = document.getElementById('song-main'+i);
                        if(doc){
                            doc.addEventListener('click', (event) => {
                                var filename = event.srcElement.outerText;
                                filename = filename.substring(0,filename.length-4)
                                retrieveLTCFilenameHooked(filename);
                                fileSelected = filename;
                                readFileSetSongsLyricsAndTimeCode(event.srcElement.outerText);
                                console.log(fileSelected)
                            });
                        }else{
                            console.log('ERROR - something went wrong....')
                        }
                    }
                }else{
                    console.log(' ERROR - cant load files, no .txt found..')
                }
            }else{
                console.log(' ERROR - cant load files, there are no files')
            }
        });
    }else{
        console.log(' ERROR - cant load files, something is wrong with currentPath: '+currentPath)
    }
    
}

function retrieveLTCFilenameHooked(filename){
    let filespathLTC = currentPath + folderMust2 + '\\'
    fs.readdir(filespathLTC, (err, files) => {
        if (err){
            console.log(' ERROR - cant load files ,'+err);
            return;
        }
        if(files){
            for(var file of files){
                if(file.includes(filename)){
                    console.log('ltc found: '+file)
                    ltcSelected = file;
                }
            }
        }else{
            console.log(' ERROR - cant load files, there are no files')
        }
    });
}

function readFileSetSongsLyricsAndTimeCode(filename){
    fileSelected = filename;
    var songDTO = {}

    filepath = currentPath + filename;
    fs.readFile(filepath, 'utf-8', (err, dataSong) => {
        if(err){
            console.log(' ERROR - '+err)
            return;
        }

        filepath = currentPath + folderMust2 +'\\'+ ltcSelected;
    
        fs.readFile(filepath, 'utf-8', (err, dataLTC) => {
            if(err){
                console.log(' ERROR - '+err)
                return;
            }
            
            var dataSongArray = dataSong.split('\r\n');
            var dataLTCArray = dataLTC.split('\r\n|');
        
            dataLTCArray = setLtcStrings(dataLTCArray);
            //set of songStrings
            dataSongArray = groupAndSetSongStrings(dataSongArray);

            document.getElementById('song-ltc-container').innerHTML = songLtcContainerBuilder(lctStrings,dataSongArray);
        });
    });


}

function groupAndSetSongStrings(dataSongArray){
    let dataResult = []
    let titleFound = false;
    let titleEnd = false;

    for(var i =0;i<dataSongArray.length;i++){
        if(i<10 && !titleEnd){
            if(dataSongArray[i].trim() == ""){
                if(titleFound){
                    dataResult.push(dataSongArray[i]);
                    titleEnd = true;
                }
            }else{
                if(titleFound){
                    dataResult.push(dataSongArray[i]);
                }else{
                    dataResult.push('');
                    dataResult.push(dataSongArray[i]);
                    titleFound = true;
                }
            }
        }else{
            dataResult.push(dataSongArray[i]);
        }
    }
    console.log(dataResult)
    songStrings = dataResult;
    return dataResult;
}

function setLtcStrings(dataLtcArray){
    var dataResult = []
    for(var sngLTX of dataLtcArray){
        sngLTX = sngLTX.replace('\r\n','');
        sngLTX = sngLTX.replace(',','');
        sngLTX = sngLTX.replace('.','');
        dataResult.push(parseInt(sngLTX.slice(0, -1)));
    }
    lctStrings = dataResult;
    return dataResult;

}

function divideSongStringsArrayToSignificantValues(dataSongArray){
    if(dataSongArray){
        for(var strSng of dataSongArray){
            if(strSng !== ''){
                counter++;
                if(counter>4 && stringGroup !== ''){
                    resultList.push(stringGroup);
                    stringGroup = '';
                    stringGroup = '|'+strSng;
                    counter = 1;
                }else{
                    stringGroup += '|'+strSng;
                }
            }else{
                if(laststrSng !== ''){
                    if(stringGroup !== ''){
                        resultList.push(stringGroup);
                        counter = 0;
                        stringGroup = '';
                    }
                }
            }
            laststrSng = strSng;
        }
    }

}


function saveLTCSongFiles(){

    let newltcFilePath = currentPath+folderMust2+'\\'+ltcSelected;
    //let newsongFilePath = currentPath+fileSelected;

    fs.writeFileSync(newltcFilePath,newLTCStrings,{encoding:'utf8',flag:'w'})
    //fs.writeFileSync(newsongFilePath,newSongStrings,{encoding:'utf8',flag:'w'})

}

function retrieveValuesFromInputsBoxes(idInputsSong, idInputsLTC){
    var stringForFileSong = '';
    var stringForFileLTC = '';
    for(var i=0;i<songStrings.length;i++){
        console.log(idInputsSong+i);
        var val = document.getElementById(idInputsSong+i).value;
        if(i==0){
            stringForFileSong += '\r\n'+val;
        }else if(i==songStrings.length-1){
            stringForFileSong += '\r\n'+val;
        }else{
            stringForFileSong += '\r\n'+val;
        }
    }
    for(var i=0;i<lctStrings.length;i++){

        var valString = document.getElementById(idInputsLTC+i).value;
        var millisLTC = ltcTransalator(valString);
        millisLTC = elaboreLTCForIgor(millisLTC);
        if(i==0){
            stringForFileLTC += millisLTC+'\r\n|'
        }else if(i==lctStrings.length-1){
            stringForFileLTC += '\r\n'+millisLTC
        }else{
            stringForFileLTC += '\r\n'+millisLTC+'\r\n|'
        }//TOFIX
    }
    newLTCStrings = stringForFileLTC
    newSongStrings = stringForFileSong

}

function elaboreLTCForIgor(temp){
    temp += '0'
    var notMillis = temp.substring(0, temp.length-4);
    var millis = temp.substring(temp.length-4, temp.length);
    return notMillis+'.'+millis;
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('closeBtn').addEventListener('click', () => {
        ipcRenderer.invoke('quit-app');
    });

    document.getElementById('minimBtn').addEventListener('click', () => {
        ipcRenderer.invoke('minimize-app');
    });

    document.getElementById('resizBtn').addEventListener('click', () => {
        ipcRenderer.invoke('resize-app');
    });
    document.getElementById('srcDirBtn').addEventListener('change', (event) => {
        if(checkPathAndSetAsCurrent(event)){
            setCurrentFiles();
        }
    });
    document.getElementById('applyBtn').addEventListener('click', () => {
        retrieveValuesFromInputsBoxes('song-string','ltc-string');
        saveLTCSongFiles();
    });

  });


function songLtcContainerBuilder(ltcStrings, songStrings){
    var base = '';
    var iSong = 0;
    console.log('lctStrings.length= '+ lctStrings.length)
    console.log('songStrings.length= '+ songStrings.length)

    for(var iLTC = 0;iLTC<ltcStrings.length;iLTC++){
        base += '<div><div class="ltc-container"><a>'+(iLTC+1)+'</a><input type="text" id="ltc-string'+iLTC+'" value="'+ltcTransalator(ltcStrings[iLTC])+'"></div>';
//        if(lctStrings.length == (songStrings.length/4)){
            base += '<div class="song-container"><input type="text" id="song-string'+iSong+'" value="'+songStrings[iSong]+'">';
            iSong++;
            base += '<input type="text" id="song-string'+iSong+'" value="'+songStrings[iSong]+'">';
            iSong++;
            base += '<input type="text" id="song-string'+iSong+'" value="'+songStrings[iSong]+'">';
            iSong++;
            base += '<input type="text" id="song-string'+iSong+'" value="'+songStrings[iSong]+'"></div></div>';
            iSong++;
//        }else{
//            base += '<div class="song-container"><input type="text" id="song-string'+iLTC+'" value="'+songStrings+'"></div></div>';
//        }
    }
    return base;
}

function songsContainerBuilder(liId,listStrings){

    var base = ''//'<ul id="'+ulId+'">';
    var counter = 0;
    for(const string of listStrings){
        base += '<p id="'+liId+counter+'">'+string+'</p>';
        counter++;
    }
    return base;
}
String 
function endsWith(string,filter,isDirectory){
    let absolutePathFound = string;
    if(isDirectory){
        absolutePathFound = string.substring(0, string.lastIndexOf("\\"));
    }
    let pathSupposedToBeFolderMust = absolutePathFound.substring(absolutePathFound.length-filter.length,absolutePathFound.length);
    if(pathSupposedToBeFolderMust){
        if(pathSupposedToBeFolderMust.includes(filter)){
            return absolutePathFound;
        }
    }
    
    return null;
}
function ltcTransalator(ltcIn){
    
    if(typeof ltcIn === typeof ''){
        //01:20:45.600
        var ltc_HH_MM_SSsss = ltcIn.split(':');

        var millisTot = 0;

        var hh = 0
        var mm = 0
        var ss = 0
        var sss = 0

        for(var i=0;i<ltc_HH_MM_SSsss.length;i++){
            hh = parseInt(ltc_HH_MM_SSsss[0]);
            mm = parseInt(ltc_HH_MM_SSsss[1]);
            var ltc_SS_sss = ltc_HH_MM_SSsss[2].split('.');
            ss = parseInt(ltc_SS_sss[0]);
            sss = parseInt(ltc_SS_sss[1]);
        }
        console.log(hh+'|'+mm+'|'+ss+'|'+sss)

        millisTot = hh * 3600000;
        millisTot = millisTot + (mm * 60000)
        millisTot = millisTot + (ss * 1000)
        millisTot = millisTot + sss

        return millisTot;

    }else if(typeof ltcIn === typeof 1){

        let seconds = Math.floor(ltcIn / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        let millis = ltcIn % 1000;

        seconds = seconds % 60;
        minutes = minutes % 60;
        hours = hours % 24;

        if(millis < 10){
            millis = '00' + millis;
        }
        if(seconds < 10){
            seconds = '0' + seconds;
        }
        if(minutes < 10){
            minutes = '0' + minutes;
        }
        if(hours < 10){
            hours = '0' + hours;
        }

        return hours+':'+minutes+':'+seconds+'.'+millis;
}
}

  