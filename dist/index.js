/**
 * HSY Orchestrator - Main Entry Point
 * 
 * Autonomous AI-powered orchestrator for systematic project development
 */

module.exports = {
  version: require('../package.json').version,
  commands: {
    init: require('./commands/init'),
    start: require('./commands/start'),
    demo: require('./commands/demo'),
    test: require('./commands/test'),
    status: require('./commands/status'),
    config: require('./commands/config'),
    hooks: require('./commands/hooks'),
    doctor: require('./commands/doctor'),
    uninstall: require('./commands/uninstall')
  }
};
