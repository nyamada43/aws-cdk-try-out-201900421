import cdk = require("@aws-cdk/cdk");
import widget_service = require("../lib/widget_service");

export class TutorialServerlessAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    new widget_service.WidgetService(this, "Widgets");
  }
}
