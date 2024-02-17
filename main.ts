import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
	hogehoge1: string;
	hogehoge2: number;
	hogehoge3: boolean;
}

interface FileAlias {
    filename: string;
    aliases: string[];
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	hogehoge1: 'string setting',
	hogehoge2: 10,
	hogehoge3: false
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('追加テスト');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'onOpen1',
			name: 'onOpen1',
			callback: () => {
				new SampleModal(this.app).onOpen1();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'openを呼び出します',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						console.log('処理開始');
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	
	async onOpen() {
		const {contentEl} = this;

		contentEl.setText('Woah!こんにちは！onOpenを呼び出しました');

		
		//特定のフォルダ配下のファイル一覧を取得

		//各ファイルのファイル名とaliasを取得する。辞書型として格納する
		//例えば'ABCD'ファイルにaliasで'a','AA'とある場合、下記２種類の配列を作成する。
		//key:'ABCD', value:'a'
		//key:'ABCD', value:'AA'
		
		
		//例えば'ABCD'ファイルにaliasで'a','AA'、'BCD'ファイルにalias'b','BB'とあった場合、
		//ファイル名の長い順番'ABCD'>'BCD'の順で並び替えを行う。

		//文章内を検索し、一致したらリンクに置き換える。（'ABCD'＞'[[ABCD]]'）
		//もし、aliasと同じ場合は、[[ABCD|a]]といった形に置き換える。

		await this.loadFilesAndAliases();

			
		


	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}

	async onOpen1(){
		//この関数を呼び出して、アクティブなペインに開かれているファイルのパスを取得
		const filePath = await this.getActiveFilePath();
		console.log("ファイルパスは、" + filePath);
		const file = this.getFileByPath(filePath);
		if (file) {
			console.log("ファイル名:", file.name);
			if (file instanceof TFile) {
				this.createFileCopy(file).then(() => console.log("コピー完了")).catch(console.error);
			} else {
				console.log("指定されたパスにファイルが見つかりません。");
			}
		} else {
			console.log("ファイルが見つかりませんでした。");
		}

	}

	async loadFilesAndAliases() {
		console.log('loadFilesAndAliasesが呼び出されました');
		const targetFolderPath: string = 'requirements';
		let fileReadPromises: Promise<FileAlias>[] = [];
	
		// 特定のフォルダ配下のファイル一覧を取得
		this.app.vault.getFiles().forEach((file: TFile) => {
			if (file.path.startsWith(targetFolderPath)) {
				// 各ファイルの内容を読み込むPromiseを配列に追加
				const promise = this.app.vault.read(file).then((content: string): FileAlias => {
					const aliases = this.extractAliases(content);
					return { filename: file.basename, aliases };
				});
				fileReadPromises.push(promise);
			}
		});
	
		// 全てのファイルの読み込みを待つ
		Promise.all(fileReadPromises).then((filesAndAliases) => {
			console.log('ファイル名が長い順にソートしてコンソールに出力');
			//ファイル名をマップする

			// ファイル名が長い順にソートしてコンソールに出力
			filesAndAliases
				.flatMap(item => {
					// ファイル名自体もエイリアスリストに追加
					const aliasesWithFilename = [...item.aliases, item.filename];
					return aliasesWithFilename.map(alias => ({ filename: item.filename, alias }));
    			})
				.sort((a, b) => b.filename.length - a.filename.length)
				.forEach(({ filename, alias }) => {
					console.log(`Key: ${filename}, Value: ${alias}`);
				});
		}).catch((err) => {
			console.error('Error processing files:', err);
		});
	}

	extractAliases(fileContent: string): string[] {
		
		console.log("extractAliasesが呼び出されました");
		// YAMLブロック内のエイリアスを検出するための正規表現パターンをさらに更新
		const yamlPattern = /^aliases:(.*?$(?:\n  - .*)*|.*?(\[.*?\])?.*?)/ms;
		const match = fileContent.match(yamlPattern);
	
		if (match) {
			// インデントされたリスト形式
			if (match[1] && match[1].includes('\n  - ')) {
				const listStyleAliases = match[1].split('\n').filter(line => line.startsWith('  - ')).map(line => line.replace('  - ', '').trim().replace(/^["']|["']$/g, ''));
				return listStyleAliases;
			} else {
				// カンマ区切り形式 (括弧がある場合もない場合も対応)
				const inlineAliases = match[1].trim();
				const aliases = inlineAliases.startsWith('[') ? inlineAliases.slice(1, -1) : inlineAliases; // 括弧を除去
				return aliases.split(',').map(alias => alias.trim().replace(/^["']|["']$/g, ''));
			}
		}
	
		return [];
	}

	
	// アクティブなペインに開かれているファイルのファイルパスを取得する関数
	getActiveFilePath() {
		// アクティブなリーフ（ペイン）を取得
		const activeLeaf = app.workspace.activeLeaf;
		if (!activeLeaf) {
			console.log("アクティブなペインがありません。");
			return null;
		}

		// リーフから現在のビューを取得
		const view = activeLeaf.view;

		// ビューがマークダウンファイルのビューであるか確認し、ファイルパスを取得
		if (view.getViewType() === "markdown") {
			// ビューからファイル情報を取得する前に、fileプロパティが存在するか確認
			if (view.file) {
				// ファイルパスを取得して返す
				return view.file.path;
			} else {
				console.log("このビューにはファイル情報が含まれていません。");
				return null;
			}
		} else {
			console.log("アクティブなペインにマークダウンファイルが開かれていません。");
			return null;
		}

	}

	// ファイルパスからTFileオブジェクトを取得する関数
    getFileByPath(filePath :string) {
    // Vaultからファイル（またはフォルダ）を取得
    const file = app.vault.getAbstractFileByPath(filePath);

    // 取得したオブジェクトがTFileインスタンスであるか確認
    if (file instanceof TFile) {
        // TFileオブジェクトであればそれを返す
        return file;
    } else {
        // TFileオブジェクトでなければ、nullを返すか、エラーメッセージを表示
        console.error("指定されたパスにファイルが存在しません。");
        return null;
    }
}


	// TFileオブジェクトを引数に取り、そのファイルのコピーを作成する関数
	async createFileCopy(originalFile :TFile) {
		try {
			// 元のファイルの内容を読み込む
			const fileContent = await app.vault.read(originalFile);

			// 新しいファイル名を決定（例: original.md -> original_copy.md）
			const originalFileName = originalFile.name;
			const fileNameParts = originalFileName.split('.');
			const fileExtension = fileNameParts.pop();
			const newFileName = `${fileNameParts.join('.')}_copy.${fileExtension}`;

			// 元のファイルと同じディレクトリに新しいファイル名でファイルを作成
			const newFilePath = originalFile.path.replace(originalFileName, newFileName);
			
			await app.vault.create(newFilePath, fileContent);
			console.log(`ファイルがコピーされました: ${newFilePath}`);
		} catch (error) {
			console.error(`ファイルのコピーに失敗しました: ${error}`);
		}
	}

}

	


class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
