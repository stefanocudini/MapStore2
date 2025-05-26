// moved here from epics/tests/layerdownload.js

// it('check WPS availability', (done) => {
//         const epicResult = actions => {
//             expect(actions.length).toBe(4);
//             expect(actions[0].type).toBe(CHECKING_WPS_AVAILABILITY);
//             expect(actions[0].checking).toBe(true);
//             expect(actions[3].type).toBe(CHECKING_WPS_AVAILABILITY);
//             expect(actions[3].checking).toBe(false);

//             actions.slice(1, actions.length - 1).map((action) => {
//                 switch (action.type) {
//                 case SET_SERVICE:
//                     expect(action.service).toBe('wfs');
//                     break;
//                 case SET_WPS_AVAILABILITY:
//                     expect(action.value).toBe(true);
//                     break;
//                 default:
//                     break;
//                 }
//             });
//             done();
//         };

//         mockAxios.onGet().reply(200, xmlData);
//         const state = {
//             controls: {
//                 layerdownload: { enabled: false, downloadOptions: {}}
//             },
//             layers: {
//                 flat: [
//                     {
//                         type: 'wfs',
//                         visibility: true,
//                         id: 'mapstore:states__7',
//                         search: {
//                             url: 'http://u.r.l'
//                         }
//                     }
//                 ],
//                 selected: [
//                     'mapstore:states__7'
//                 ]
//             }
//         };
//         testEpic(checkWPSAvailabilityEpic, 4, checkWPSAvailability('http://check.wps.availability.url', 'wfs'), epicResult, state);
//     });

//     it('should select WPS service', (done) => {
//         const epicResult = actions => {
//             expect(actions.length).toBe(4);
//             actions.map((action) => {
//                 switch (action.type) {
//                 case SET_SERVICE:
//                     expect(action.service).toBe('wps');
//                     break;
//                 default:
//                     break;
//                 }
//             });
//             done();
//         };

//         mockAxios.onGet().reply(200, xmlData);
//         const state = {
//             controls: {
//                 layerdownload: { enabled: false, downloadOptions: {}}
//             },
//             layers: {
//                 flat: [
//                     {
//                         type: 'wms',
//                         visibility: true,
//                         id: 'mapstore:states__7'
//                     }
//                 ],
//                 selected: [
//                     'mapstore:states__7'
//                 ]
//             }
//         };
//         testEpic(checkWPSAvailabilityEpic, 4, checkWPSAvailability('http://check.wps.availability.url', 'wfs'), epicResult, state);
//     });
