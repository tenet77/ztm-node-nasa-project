const { 
    getAllLaunches,
    addNewLaunch,
    abortLaunches,
    hasLaunchById,
 } = require('../../models/launches.model');

const {
    getPagination,
} = require('../../services/query');

async function httpGetAllLaunches(req, res) {

    const { skip, limit } = getPagination(req.query);

    const allLaunches = await getAllLaunches(skip, limit);

    return res.status(200).json(allLaunches);
}

async function httpAddNewLaunch(req, res) {

    const launch = req.body;

    if (!launch.mission || !launch.rocket || !launch.launchDate || !launch.target) {
        return res.status(400).json({
            error: 'Missing correct prorerty',
        });
    };
    launch.launchDate   = new Date(launch.launchDate);

    if (isNaN(launch.launchDate)) {
        return res.status(400).json({
            error: 'Incorrect launch date',
        });
    };

    await addNewLaunch(launch);

    return res.status(201).json(launch);

}

async function httpAbortLaunch(req, res) {

    const flightNumber = Number(req.params.id);

    if (!hasLaunchById(flightNumber)) {
        return res.status(404).json({
            error: 'Launch not defined',
        });
    };

    const aborted = await abortLaunches(flightNumber);
    if (!aborted) {
        return res.status(400).json({
            error: 'Launch not aborted'
    })
    } else {
        return res.status(200).json({
            ok: true
        });
    }
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch,
}