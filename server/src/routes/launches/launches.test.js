const request = require('supertest');
const app = require('../../app');
const { 
    mongoConnect,
    mongoDisconnect,
 } = require('../../services/mongo');

describe('Launces API', () => {

    beforeAll(async () => {
        await mongoConnect();
    });

    afterAll(async () => {
        mongoDisconnect();
    });

    describe('Test GET /launches', () => {
        test('It should respond 200 success', async () => {
            const response = await request(app)
            .get('/v1/launches')
            .expect('Content-Type', /json/)
            .expect(200);
        });
    });
    
    describe('Test POST /launches', () => {
        const sendingData = {
            mission: 'Kepler Exploration X',
            rocket: 'Explorer IS1',
            launchDate: 'December 27, 2030',
            target: 'Kepler-442 b',
         };
    
         const sendingDataWoDate = {
            mission: 'Kepler Exploration X',
            rocket: 'Explorer IS1',
            target: 'Kepler-442 b',
         };
    
        test('It should respond 201 created', async () => {
    
            const response = await request(app)
                .post('/v1/launches')
                .send(sendingData)
                .expect('Content-Type', /json/)
                .expect(201);
    
            const requestDate = new Date(sendingData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
    
            expect(responseDate).toBe(requestDate);
            
            expect(response.body).toMatchObject(sendingDataWoDate);
    
        });
        test('It should catch missing required properties', async() => {
            const response = await request(app)
                .post('/v1/launches')
                .send(sendingDataWoDate)
                .expect('Content-Type', /json/)
                .expect(400);
    
            expect(response.body).toStrictEqual({
                error: 'Missing correct prorerty',
            });
    
        });
        test('It should catch invalid dates', async () => {
            
            sendingDataWoDate.launchDate = 'hello';
    
            const response = await request(app)
                .post('/v1/launches')
                .send(sendingDataWoDate)
                .expect('Content-Type', /json/)
                .expect(400);
    
            expect(response.body).toStrictEqual({
                error: 'Incorrect launch date',
            });
    
        });
    
    });
});
