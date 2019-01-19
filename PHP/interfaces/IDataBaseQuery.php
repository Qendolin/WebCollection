<?php
interface IDatabaseQuery {
    public function AskDB($db,$statement,mixed ...$params): void;
}