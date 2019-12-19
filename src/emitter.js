import {EventEmitter} from 'events';
import ObserveLogs from "./ObserveLogs";

const emitter = new EventEmitter().setMaxListeners(0);

let listenStarted = false;
let lastDocId = null;

function observeLogs(){
    listenStarted = false;
    new ObserveLogs({
        type:'started',
        collectionName:null,
        arguments:null,
        date:new Date()
    }).save().then((result)=>{
        const cursor = ObserveLogs
            .find()
            .tailable({ awaitdata : true })
            .cursor();

        cursor.on('data', (doc) => {
            if(!listenStarted && String(result.id) == String(doc.id) ) {
                listenStarted = true;
                emitter.emit('ready');
            }
            if(listenStarted){
                emitter.emit(doc.collectionName, doc);
                lastDocId = String(doc.id);
            }else if(lastDocId && lastDocId == String(doc.id)){
                listenStarted = true;
                emitter.emit('ready');
            }
        });

        cursor.on('close', function() {
            console.log('closing...');
            emitter.emit('notready');
            setTimeout(observeLogs,1000);
        });

        cursor.on('error', error => {
            console.error(error);
            cursor.destroy();
        });

    },(err)=>{
        setTimeout(observeLogs,1000);
        console.error(err);
    });
}

observeLogs();

export default emitter;