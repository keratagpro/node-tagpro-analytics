#!/usr/bin/php
<?php

// Copyright (c) 2015, Jeroen van der Gun
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//    conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of
//    conditions and the following disclaimer in the documentation and/or other materials
//    provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
// OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
// TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

error_reporting(E_ALL);
ini_set('display_errors', '1');
if ($argc != 2)
    die('Usage: php ' . $argv[0] . " <filename>\n");

require './logreader.php';

class PlayerEventHandler extends PlayerLogReader
{
    protected function dropEvent($time, $oldFlag, $powers, $team)
    {
        global $pops;
        $pops[$team][$time] = true;
    }
    protected function popEvent($time, $powers, $team)
    {
        global $pops;
        $pops[$team][$time] = true;
    }
    public function __construct()
    {
        global $match, $player;
        parent::__construct(base64_decode($player->events), $player->team, $match->duration);
    }
}

class MapEventHandler extends MapLogReader
{
    protected function heightEvent($newY)
    {
        global $mapHeight;
        $mapHeight = $newY + 1;
    }
    public function __construct()
    {
        global $match;
        parent::__construct(base64_decode($match->map->tiles), $match->map->width);
    }
}

class SplatEventHandler extends SplatLogReader
{
    protected function splatsEvent($splats, $time)
    {
        global $pops, $index;
        foreach ($splats as $splat)
            echo timeFormat($pops[$index + 1][$time]), ' (', $splat[0], ',', $splat[1], ")\n";
    }
    public function __construct()
    {
        global $team, $match, $mapHeight;
        parent::__construct(base64_decode($team->splats), $match->map->width, $mapHeight);
    }
}

function timeFormat($time)
{
    return floor($time / 3600) . ':' . str_pad(floor($time % 3600 / 60), 2, '0', STR_PAD_LEFT) . '.' . str_pad(round($time % 60 / 0.6), 2, '0', STR_PAD_LEFT);
}

$match = json_decode(file_get_contents($argv[1]));

$mapHeight = 1;
new MapEventHandler();

$pops = array(
    1 => array(),
    array()
);

foreach ($match->players as $player) {
    new PlayerEventHandler();
}

foreach ($match->teams as $index => $team) {
    echo "\nTEAM ", $index + 1, " SPLATS\n";
    ksort($pops[$index + 1]);
    $pops[$index + 1] = array_keys($pops[$index + 1]);
    $splats           = array();
    new SplatEventHandler();
}

echo "\n";

?>