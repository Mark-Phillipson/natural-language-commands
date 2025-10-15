import 'mocha';
import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ChatSidebarProvider } from '../chatSidebarProvider';

suite('Copilot Chat Focus Intent', () => {
    let provider: ChatSidebarProvider;
    let executeCommandStub: sinon.SinonStub;
    let sendMessageSpy: sinon.SinonSpy;

    setup(() => {
        provider = new ChatSidebarProvider(vscode.Uri.file('.'));
        executeCommandStub = sinon.stub(vscode.commands, 'executeCommand');
        sendMessageSpy = sinon.spy((provider as any), '_sendMessageToWebview');
    });

    teardown(() => {
        sinon.restore();
    });

    test('tries all Copilot Chat focus commands in order and reports error if none succeed', async () => {
        // All commands throw
        executeCommandStub.rejects(new Error('not found'));
        await provider.sendUserMessageToChat('move keyboard focus to copilot chat');
        // Should have tried all known commands
        const triedCommands = [
            'github.copilot-chat.focus',
            'workbench.panel.chat.view.copilot.focus',
            'workbench.action.focusChat',
            'workbench.view.extension.github-copilot-chat',
            'workbench.view.extension.copilot-chat',
            'workbench.action.openChat',
            'workbench.action.focusSidePanel',
        ];
        for (const cmd of triedCommands) {
            assert.ok(executeCommandStub.calledWith(cmd), `Should try command: ${cmd}`);
        }
        // Should report error message
        const errorCall = sendMessageSpy.getCalls().find(call => {
            return call.args[1]?.content && call.args[1].content.includes('Could not focus Copilot Chat');
        });
        assert.ok(errorCall, 'Should send error message to webview');
    });

    test('succeeds if one of the commands works', async () => {
        // First two fail, third succeeds
        executeCommandStub.onCall(0).rejects(new Error('not found'));
        executeCommandStub.onCall(1).rejects(new Error('not found'));
        executeCommandStub.onCall(2).resolves();
        await provider.sendUserMessageToChat('focus copilot chat');
        assert.ok(executeCommandStub.callCount >= 3, 'Should try at least three commands');
        // Should not send error message
        const errorCall = sendMessageSpy.getCalls().find(call => {
            return call.args[1]?.content && call.args[1].content.includes('Could not focus Copilot Chat');
        });
        assert.ok(!errorCall, 'Should not send error message if a command succeeds');
    });
});
