[![](https://api.travis-ci.org/meteorhacks/zones.svg)](https://travis-ci.org/meteorhacks/zones)
# zones

### Zone.JS integration for meteor

With [Zone.JS](https://github.com/angular/zone.js) integration, we can follow Meteor's async execution path (in client) and identify more information which is not possible before.

With zones, error tracking can be improved and it provided stack traces over async execution path.

[![Demo: Zone.JS with Meteor](https://i.cloudup.com/uD_z8km2Xz.png)](http://zones-example.meteor.com/)

### Installation
    
    meteor add meteorhacks:zones

    // for older Meteor version
    mrt add zones

That's all you've to do :)

### Integration with Kadira

If you've added zones into a Meteor application which is being monitored with Kadira, error tracking on client can be improved dramatically. See following error trace:

![Kadira Error Tracking improved using Zones](https://cldup.com/-sxdlAvujw.png)

For more information, visit Kadira's [error tracking docs](http://support.kadira.io/knowledgebase/articles/421158-client-side-error-tracking-with-zones).