import { Button } from "azure-devops-ui/Button";
import { TextField, TextFieldWidth } from "azure-devops-ui/TextField";
import { IWorkItemChangedArgs, IWorkItemFieldChangedArgs, IWorkItemFormService, IWorkItemLoadedArgs, WorkItemTrackingServiceIds } from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";
import * as React from "react";
import { showRootComponent } from "../Common";
import "azure-devops-ui/Core/override.css";
import axios from "axios";

interface WorkItemFormGroupComponentState {
    eventContent: string;
    name: string;
    errorMessage: string;
}

export class WorkItemFormGroupComponent extends React.Component<{}, WorkItemFormGroupComponentState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            eventContent: "",
            name: "",
            errorMessage: ""
        };
    }

    public componentDidMount() {
        SDK.init().then(() => {
            SDK.register(SDK.getContributionId(), () => {
                return {
                    // Called when the active work item is modified
                    onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
                        this.setState({
                            eventContent: `onFieldChanged - ${JSON.stringify(args)}`
                        });
                    },

                    // Called when a new work item is being loaded in the UI
                    onLoaded: (args: IWorkItemLoadedArgs) => {
                        this.setState({
                            eventContent: `onLoaded - ${JSON.stringify(args)}`
                        });
                    },

                    // Called when the active work item is being unloaded in the UI
                    onUnloaded: (args: IWorkItemChangedArgs) => {
                        this.setState({
                            eventContent: `onUnloaded - ${JSON.stringify(args)}`
                        });
                    },

                    // Called after the work item has been saved
                    onSaved: (args: IWorkItemChangedArgs) => {
                        this.setState({
                            eventContent: `onSaved - ${JSON.stringify(args)}`
                        });
                    },

                    // Called when the work item is reset to its unmodified state (undo)
                    onReset: (args: IWorkItemChangedArgs) => {
                        this.setState({
                            eventContent: `onReset - ${JSON.stringify(args)}`
                        });
                    },

                    // Called when the work item has been refreshed from the server
                    onRefreshed: (args: IWorkItemChangedArgs) => {
                        this.setState({
                            eventContent: `onRefreshed - ${JSON.stringify(args)}`
                        });
                    }
                }
            });
        });
    }

    public render(): JSX.Element {
        return (
            <div>
                EventContext: {this.state.eventContent}
                <TextField
                    value={this.state.name}
                    onChange={(e, newValue) => (this.setState({ name: newValue }))}
                    placeholder="Enter your name"
                    width={TextFieldWidth.standard} />
                <Button
                    text="Ask the backend for a greeting"
                    primary={true}
                    onClick={() => this.onClick()}
                />
                {this.state.errorMessage}
            </div>
        );
    }

    private async onClick() {
        const appToken = await SDK.getAppToken();
        const response = await axios.get(`http://localhost:5000/Example?name=${this.state.name}`, {
            headers: {
                'Authorization': `Bearer ${appToken}`
            }
        });
        if (response.status === 200) {
            const workItemFormService = await SDK.getService<IWorkItemFormService>(
                WorkItemTrackingServiceIds.WorkItemFormService
            );
            workItemFormService.setFieldValue(
                "System.Title",
                `"${response.data}" set by extension`
            );
            this.setState({ errorMessage: "" });
        } else {
            this.setState({ errorMessage: JSON.stringify(response) });
        }
    }
}

export default WorkItemFormGroupComponent;

showRootComponent(<WorkItemFormGroupComponent />);