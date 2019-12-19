import emitter from "./emitter";
import EJSON from 'ejson';
import _ from 'underscore';
import sift from 'sift';
import queue from 'async/queue';
import DiffSequence from "./DiffSequence";
import {EventEmitter} from 'events';

function delayedPromise(timeout){
    if(timeout<=0)
        return Promise.resolve();
    return new Promise((resolve)=>{
        setTimeout(resolve,timeout);
    });
}

class ObserveCursor extends EventEmitter{
    constructor(query,options={}){
        super();
        this.setMaxListeners(0);
        this.query = query;
        this.handlers = null;
        this.modelsMap = {};
        this.lastRefreshed = 0;
        this.stopped = false;
        this.wasRefreshed = false;
        this.once('refresh',()=>{
            this.wasRefreshed = true;
        });

        this.queue = queue(async (task, callback)=> {
            this.queryStarted = false;
            let delay = task.refreshDate-Date.now() ;
            if(delay>0){
                await new Promise((resolve)=>{
                    setTimeout(function(){
                        resolve();
                    },delay);
                });
            }

            this.queryStarted = true;
            let started = Date.now();
            this.query.exec((err,results)=>{
                this.queryStarted = false;
                this.lastRefreshed = Date.now();
                console.log('refresh query exec end');
                if(err)
                    return callback();//TODO error handle
                let newAssoc = _.chain(results)
                    .map((doc)=>{
                        return EJSON.clone( doc.toObject({ getters: false }) );
                    })
                    .indexBy('_id')
                    .value();

                if(this.handlers.removed) {
                    let removedIds = _.difference( _.keys(this.modelsMap), _.keys(newAssoc) );
                    _.each(removedIds,(_id)=>{
                        this.handlers.removed.apply(this, [_id,this.modelsMap[_id]]);
                    });
                }

                _.chain(newAssoc)
                    .each((result)=>{
                        let rawResult =  newAssoc[String(result._id)];
                        let _id = _.isString(result._id)?result._id:String(result._id);
                        newAssoc[_id] = rawResult;
                        let oldModel = this.modelsMap[_id];
                        if(!oldModel&&this.handlers.added){
                            this.handlers.added.apply(this, [result._id,result]);
                        }
                        if( oldModel && this.handlers.changed && !EJSON.equals(oldModel, rawResult)){
                            let changedFields = DiffSequence.makeChangedFields(rawResult, oldModel);
                            if( !_.isEmpty(changedFields)  ){
                                this.handlers.changed.apply(this, [result._id,changedFields,result]);
                            }
                        }
                    });

                this.modelsMap = newAssoc;
                this.emit('refresh',Date.now()-started);
                callback();
            });


        },1 );

        this.pollingIntervalMs = options.pollingIntervalMs || 60000;
        this.pollingThrottleMs = options.pollingThrottleMs || 1000;
    }

    scheduleRefresh(task){
        //console.log('sheduleRefresh length:',this.queue.length(),'running:',this.queue.running());
        if(this.queue.length()>0)
            return Promise.resolve(false);
        if(this.queue.running()>0 && !this.queryStarted)
            return Promise.resolve(false);

        let pollingThrottleMs = this.pollingThrottleMs;
        if(_.isFunction(pollingThrottleMs)){
            pollingThrottleMs = pollingThrottleMs.apply(this,[]);
            if(!_.isNumber(pollingThrottleMs)){
                pollingThrottleMs = 1000;
            }
        }
        let delay = this.lastRefreshed ? pollingThrottleMs - ( Date.now() - this.lastRefreshed ) : 0;
        //console.log({delay});
        let refreshDate = new Date();
        if(delay>0){
            refreshDate = new Date(Date.now()+delay);
        }

        return new Promise((resolve)=>{
            this.queue.push({refreshDate:refreshDate},()=>{
                resolve();
            });
        });
    }

    observeChanges(handlers){
        this.handlers = handlers;
        const rawConditions = EJSON.clone(this.query._conditions);
        const siftQuery = sift(rawConditions);

        let listener = (doc)=>{
            if(doc.type=='save'&&this.handlers.added){
                let mongooseModel = _.first( doc.arguments );
                if(mongooseModel) {
                    let rawModel = EJSON.clone(mongooseModel);
                    if (siftQuery(rawModel)) {
                        return this.scheduleRefresh(rawModel);
                    }
                }
                return;
            }
            if(doc.type=='remove'&&this.handlers.removed){
                let finded = false;
                let siftQuery = sift( EJSON.clone(_.first( doc.arguments ) ) );
                _.each(this.modelsMap,(rawModel)=>{
                    if(!finded && siftQuery(rawModel)){
                        finded = true;
                        return this.scheduleRefresh(rawModel);
                    }
                });
                return;
            }

            if(doc.type=='update'){
                return this.scheduleRefresh();
            }
        };
        emitter.on(this.query.mongooseCollection.name,listener);

        this.scheduleRefresh();
        this.doPolling();
        return this;
    }

    doPolling(){
        let pollingQueue = new queue(async (task,callback)=>{
            if(!this.lastRefreshed) {
                await delayedPromise(100);
                return callback ();
            }
            let pollingIntervalMs = _.isFunction(this.pollingIntervalMs)?this.pollingIntervalMs.apply(this):this.pollingIntervalMs;
            if(!_.isNumber(pollingIntervalMs)){
                pollingIntervalMs = 60000;
            }
            let timeout = pollingIntervalMs - ( Date.now() - this.lastRefreshed );
            if(timeout>0){
                await delayedPromise(timeout);
            }
            if(!this.stopped) {
                await this.scheduleRefresh();
            }
            callback();
        },1);

        pollingQueue.push(null);

        pollingQueue.drain(()=>{
            if(!this.stopped) {
                setTimeout(()=>{
                    pollingQueue.push(null);
                },0);
            }
        });
    }

    models(){
        return new Promise((resolve)=>{
            let onReady = ()=>{
                resolve(_.values(this.modelsMap));
            }
            if(this.wasRefreshed)
                return onReady();
            else{
                this.once('refresh',onReady);
            }
        });
    }

    stop(){
        this.stopped = true;
        this.emit('stop');
    }

}

export default ObserveCursor;