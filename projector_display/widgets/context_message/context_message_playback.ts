import { DataSource } from "../../js/datasource";
import { WidgetState, Global_DefinedProjectorErrorMessage, Global_PlaybackErrorMessageState } from "../../types/state";
import { contextMessageWidget } from "./context_message_app";

interface ContextMessagePrivateState {
    systemDataSource: DataSource | null;
}

export class ContextMessageWidgetPlayback {
    private _private: ContextMessagePrivateState;

    constructor() {
        this._private = {
            systemDataSource: null,
        };
    }

    public applyData(data: string): void {
        contextMessageWidget.updateData(data);
    }

    public applyState(state: number): void {
        switch (state) {
            case WidgetState.Show:
                contextMessageWidget.show();
                break;

            case WidgetState.Hide:
                contextMessageWidget.hide();
                break;
        }
    }

    public async init(systemDataSource: DataSource): Promise<void> {
        this._private.systemDataSource = systemDataSource;

        this._private.systemDataSource.onStateChanged((variable: unknown, data: unknown) => {
            const globalVariable = variable as string;

            switch (globalVariable) {
                case Global_DefinedProjectorErrorMessage:
                    this.applyData(data as string);
                    break;

                case Global_PlaybackErrorMessageState:
                    this.applyState(data as number);
                    break;
            }
        });

        const currentData = await this._private.systemDataSource.read<string>(Global_DefinedProjectorErrorMessage);
        this.applyData(currentData);

        const currentState = await this._private.systemDataSource.read<number>(Global_PlaybackErrorMessageState);
        this.applyState(currentState);
    }
}

export const contextMessageWidgetPlaybackInstance = new ContextMessageWidgetPlayback();