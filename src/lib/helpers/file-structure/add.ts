import nestedProperty from 'nested-property';
import { v4 as uuidv4 } from 'uuid';

import { get } from 'svelte/store';
import { files } from '../../store/files';
import { contextmenuSelectedNote } from '../../store/contextmenuSelectedNote';

import { findPath } from '../findpath';

import type { MarkdownFile } from 'src/lib/types/markdownfile';
import type { Folder } from 'src/lib/types/folder';
import type { FileStructure } from 'src/lib/types/filestructure';

export function addNote() {
	const newNote: MarkdownFile = {
		key: uuidv4(),
		name: 'New Note!',
		md: '# New Note!'
	};

	_add(newNote);
}

export function addFolder() {
	const newFolder: Folder = {
		key: uuidv4(),
		name: 'New Folder!',
		files: []
	};

	_add(newFolder);
}

function _add(newNode: Folder | MarkdownFile) {
	const _files: FileStructure = get(files);
	const selectedKey: string = get(contextmenuSelectedNote);
	const pathToSelectedItem: string = selectedKey ? findPath(_files, 'key', selectedKey) : '';
	const selectedItem: MarkdownFile | Folder = pathToSelectedItem
		? nestedProperty.get(_files, pathToSelectedItem)
		: '';

	// handle right click from a folder
	if (selectedItem && selectedItem.hasOwnProperty('files')) {
		(<Folder>selectedItem).files = [...(<Folder>selectedItem).files, newNode];

		nestedProperty.set(_files, pathToSelectedItem, selectedItem);
		files.set(_files);
		contextmenuSelectedNote.set('');
		return;
	}

	// handle add node to base of structure
	if (!selectedKey || (selectedKey && !isNaN(Number(pathToSelectedItem)))) {
		files.set([..._files, newNode]);
		contextmenuSelectedNote.set('');
		return;
	}

	if (selectedItem && !selectedItem.hasOwnProperty('files')) {
		// handle find where to add node to structure
		/*
			if a user has selected to add a new file having right clicked on a 
			file embedded in the file structure, we need to find the parent folder
			to the file the user selected. Adding the file to that parent folder.
		*/
		const pathToParentFolder: string = pathToSelectedItem.substring(
			0,
			pathToSelectedItem.lastIndexOf('.files')
		);
		const parentFolder: Folder = nestedProperty.get(_files, pathToParentFolder);

		parentFolder.files = [...parentFolder.files, newNode];

		nestedProperty.set(_files, pathToSelectedItem, selectedItem);
		files.set(_files);
		contextmenuSelectedNote.set('');
		return;
	}

	// fallback
	files.set([..._files, newNode]);
	contextmenuSelectedNote.set('');
	return;
}
