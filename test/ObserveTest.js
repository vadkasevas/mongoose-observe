import 'should';
import {describe,before,beforeEach,it} from 'mocha';
import mongoose from 'mongoose';
import MainModels from "./models/MainModel";
import StubObserver from "./models/stubs/StubObserver";
import Roles from "./models/Roles";
import Tags from "./models/Tags";


describe('Observe',()=>{
    before(function (done) {
        this.timeout(10000);
        mongoose.set('useNewUrlParser', true);
        mongoose.set('useCreateIndex', true);
        mongoose.set('useUnifiedTopology',true);
        mongoose.set('debug',process.env.MONGOOSE_DEBUG=='1');
        mongoose.set('useFindAndModify',false);
        mongoose.connect('mongodb://localhost:27017/observeTest', done);
    });

    beforeEach(async function() {
        await MainModels.deleteMany({});
        await Roles.deleteMany({});
        await Tags.deleteMany({});
    });

    it('observer base',async function(){
        let doc = await new MainModels({
            name:'observer'
        }).save();

        let models = {};
        let observer = MainModels.find().observeChanges({
            added(id,doc){
                models[id] = doc;
            },
            changed(id,fields,newDoc,oldDoc){
                models[id] = newDoc;
            },
            removed(id,doc){
                delete models[id];
            }
        },{
            pollingThrottleMs:1
        });
        let stubObserver = new StubObserver( observer );
        await stubObserver.waitEvent('added',1001);
        models.should.have.size(1);

        doc.updated = new Date();
        await doc.save();
        await stubObserver.waitEvent('changed',1002);
        doc.updated.should.eql( models[doc.id].updated , 'Поле должно обновиться');

        doc.remove();
        await stubObserver.waitEvent('removed',11003);
        models.should.have.size(0,'Элемент не удален');

        doc = await new MainModels({
            name:'observer'
        }).save();
        await stubObserver.waitEvent('added',1004);
        doc.deleteOne();
        await stubObserver.waitEvent('removed',1005);
        await new MainModels({
            name:'observer'
        }).save();
        await stubObserver.waitEvent('added',1006);
        await MainModels.remove({});
        await stubObserver.waitEvent('removed',1007);

        doc = await new MainModels({
            name:'observer'
        }).save();
        await stubObserver.waitEvent('added',1008);
        await doc.updateOne({updated:new Date()});
        await stubObserver.waitEvent('changed',1009);
        await MainModels.deleteMany({});
        await stubObserver.waitEvent('removed',1010);
        doc = await new MainModels({
            name:'observer'
        }).save();
        await stubObserver.waitEvent('added',1011);
        await MainModels.deleteOne({});
        await stubObserver.waitEvent('removed',1012);

        doc = await new MainModels({
            name:'isLast'
        }).save();
        await stubObserver.waitEvent('added',1013);
        await MainModels.findOneAndDelete();
        await stubObserver.waitEvent('removed',1014);

        doc = await new MainModels({
            name:'isLast'
        }).save();
        await stubObserver.waitEvent('added',1015);
        await MainModels.findOneAndRemove();
        await stubObserver.waitEvent('removed',1016);
        observer.stop();
    });

    it('observe relations', async function(){
        let models = {};
        let deepObserver = MainModels.find().populate(['tags','role']).observeDeepChanges({
            added(id,doc){
                models[id] = doc;
            },
            changed(id,fields,newDoc,oldDoc){
                models[id] = newDoc;
            },
            removed(id,doc){
                delete models[id];
            }
        },{
            pollingIntervalMs:10000,
            pollingThrottleMs:10
        });
        deepObserver.on('changed',()=>{
            console.log('deepObserver changed')
        });
        let stubObserver = new StubObserver( deepObserver );
        let mainModel = await new MainModels({
            name:'relations'
        }).save();
        //await stubObserver.waitEvent('added',1001);
        await stubObserver.waitRefresh(1001);
        let roleModel = await new Roles({
            name:'testRole'
        }).save();
        let tagsModel = await new Tags({
            name:'testTag'
        }).save();
        mainModel.tag_ids = [tagsModel._id];
        mainModel.role_id = roleModel._id;

        await mainModel.save();
        await stubObserver.waitRefresh(1002);
        tagsModel.name = 'testTag2';
        await tagsModel.save();
        await stubObserver.waitEvent('changed',1003);

        tagsModel.name = 'testTag3';
        await tagsModel.save();
        await stubObserver.waitEvent('changed',1004);

        roleModel.name = 'testRole2';
        await roleModel.save();
        let changedArgs = await stubObserver.waitEvent('changed',1005);
        setTimeout(()=>{
            deepObserver.rootObserver.emit('refresh',0);
        },1);
        stubObserver.waitEvent('changed',6).should.be.rejected();
        console.log({changedArgs});
    });

});