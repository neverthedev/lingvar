from __future__ import annotations

import re
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Field, field_validator, model_validator


ID_PATTERN = re.compile(r"^[a-z0-9_-]+$")


class StrictModel(BaseModel):
    model_config = {"extra": "forbid"}


class ColumnDefinition(StrictModel):
    key: str = Field(min_length=1, max_length=100)
    label: str = Field(min_length=1, max_length=100)

    @field_validator("key", "label")
    @classmethod
    def strip_value(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Значение не может быть пустым")
        return value


class SourceDefinition(StrictModel):
    source_code: str
    sample_size: int | None = Field(default=None, gt=0)

    @field_validator("source_code")
    @classmethod
    def strip_source(cls, value: str) -> str:
        return value.strip()


class FormTableDefinition(SourceDefinition):
    columns: list[ColumnDefinition] = Field(min_length=1)
    max_attempts: Literal[3] = 3

    @model_validator(mode="after")
    def unique_columns(self):
        keys = [column.key for column in self.columns]
        if len(keys) != len(set(keys)):
            raise ValueError("Ключи колонок должны быть уникальными")
        return self


class SingleInputDefinition(SourceDefinition):
    max_attempts: Literal[3] = 3
    reveal_after_exhaustion: Literal[True] = True


class SelfCheckDefinition(SourceDefinition):
    pass


class TextPart(StrictModel):
    kind: Literal["text"]
    text: str = Field(min_length=1)

    @field_validator("text")
    @classmethod
    def non_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Текст не может состоять только из пробелов")
        return value


class BlankPart(StrictModel):
    kind: Literal["blank"]
    id: str = Field(min_length=1, max_length=100)
    hint: str | None = None
    rule_id: int | None = None
    accepted_answers: list[str] = Field(min_length=1)

    @field_validator("id")
    @classmethod
    def valid_id(cls, value: str) -> str:
        if not ID_PATTERN.fullmatch(value):
            raise ValueError("ID может содержать только строчные латинские буквы, цифры, - и _")
        return value

    @field_validator("hint")
    @classmethod
    def normalize_hint(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("accepted_answers")
    @classmethod
    def valid_answers(cls, values: list[str]) -> list[str]:
        result = []
        seen = set()
        for value in values:
            value = value.strip()
            if not value:
                raise ValueError("Допустимый ответ не может быть пустым")
            normalized = value.casefold()
            if normalized in seen:
                raise ValueError("Допустимые ответы не должны повторяться")
            seen.add(normalized)
            result.append(value)
        word_counts = {len(value.split()) for value in result}
        if len(word_counts) != 1:
            raise ValueError("Все допустимые ответы должны содержать одинаковое число слов")
        return result


Part = Annotated[Union[TextPart, BlankPart], Field(discriminator="kind")]


class FillBlanksItem(StrictModel):
    id: str = Field(min_length=1, max_length=100)
    parts: list[Part] = Field(min_length=1)

    @field_validator("id")
    @classmethod
    def valid_id(cls, value: str) -> str:
        if not ID_PATTERN.fullmatch(value):
            raise ValueError("ID может содержать только строчные латинские буквы, цифры, - и _")
        return value


class FillBlanksDefinition(StrictModel):
    items: list[FillBlanksItem] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_ids_and_blanks(self):
        item_ids = [item.id for item in self.items]
        if len(item_ids) != len(set(item_ids)):
            raise ValueError("ID элементов должны быть уникальными")
        blank_ids = [part.id for item in self.items for part in item.parts if isinstance(part, BlankPart)]
        if not blank_ids:
            raise ValueError("Упражнение должно содержать хотя бы один пропуск")
        if len(blank_ids) != len(set(blank_ids)):
            raise ValueError("ID пропусков должны быть уникальными")
        return self


Definition = FormTableDefinition | SingleInputDefinition | SelfCheckDefinition | FillBlanksDefinition


class ExerciseCreate(StrictModel):
    slug: str = Field(min_length=1, max_length=100)
    type_code: str = Field(min_length=1, max_length=50)
    schema_version: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    instruction: str = Field(min_length=1)
    difficulty: Literal["beginner", "intermediate", "advanced"]
    estimated_duration_minutes: int | None = Field(default=None, gt=0)
    display_order: int = Field(ge=0)
    status: Literal["draft", "published"]
    rule_id: int
    definition: dict[str, Any]

    @field_validator("slug")
    @classmethod
    def valid_slug(cls, value: str) -> str:
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value):
            raise ValueError("Slug должен быть lower-kebab-case")
        return value

    @field_validator("title", "instruction")
    @classmethod
    def non_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Поле не может быть пустым")
        return value


class ExerciseUpdate(StrictModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    instruction: str = Field(min_length=1)
    difficulty: Literal["beginner", "intermediate", "advanced"]
    estimated_duration_minutes: int | None = Field(default=None, gt=0)
    display_order: int = Field(ge=0)
    status: Literal["draft", "published"]
    rule_id: int
    definition: dict[str, Any]

    @field_validator("title", "instruction")
    @classmethod
    def non_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Поле не может быть пустым")
        return value


class BlankCheckRequest(StrictModel):
    answer: str


class FormTableCheckAction(StrictModel):
    action: Literal["form_table_check"]
    row_id: int
    column_key: str
    answer: str
    expected_attempts_used: int = Field(ge=0)


class FormTableWeightAction(StrictModel):
    action: Literal["form_table_weight"]
    row_id: int
    direction: Literal["up", "down"]


class SingleInputCheckAction(StrictModel):
    action: Literal["single_input_check"]
    item_id: int
    answer: str
    expected_attempts_used: int = Field(ge=0)


class SelfCheckRevealAction(StrictModel):
    action: Literal["self_check_reveal"]
    item_id: int


class SelfCheckMarkAction(StrictModel):
    action: Literal["self_check_mark"]
    item_id: int
    result: Literal["correct", "incorrect"]


class FillBlankCheckAction(StrictModel):
    action: Literal["fill_blank_check"]
    blank_id: str
    answer: str
    expected_attempts_used: int = Field(ge=0)


class FillBlankGroupCheckAction(StrictModel):
    action: Literal["fill_blank_group_check"]
    blank_ids: list[str] = Field(min_length=2)
    answer: str
    expected_attempts_used: dict[str, int]

    @model_validator(mode="after")
    def matching_expected_attempts(self):
        if set(self.blank_ids) != set(self.expected_attempts_used):
            raise ValueError("Для каждого пропуска должно быть указано ожидаемое число попыток")
        if any(value < 0 for value in self.expected_attempts_used.values()):
            raise ValueError("Число попыток не может быть отрицательным")
        return self


SessionActionRequest = Annotated[
    Union[
        FormTableCheckAction,
        FormTableWeightAction,
        SingleInputCheckAction,
        SelfCheckRevealAction,
        SelfCheckMarkAction,
        FillBlankCheckAction,
        FillBlankGroupCheckAction,
    ],
    Field(discriminator="action"),
]


class LearnerCatalogItem(StrictModel):
    slug: str
    title: str
    description: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    estimated_duration_minutes: int | None
    type_code: Literal["form_table", "single_input", "self_check", "fill_blanks"]


class LearnerCatalogRule(StrictModel):
    id: int
    title: str


class LearnerCatalogGroup(StrictModel):
    root_rule: LearnerCatalogRule
    exercises: list[LearnerCatalogItem]


class LearnerFormTableRow(StrictModel):
    id: int
    prompt: str
    answers: dict[str, str]
    weight: int | None = None


class LearnerFormTableContent(StrictModel):
    columns: list[ColumnDefinition]
    max_attempts: Literal[3]
    statistics_word_type: str
    rows: list[LearnerFormTableRow]


class LearnerSingleInputItem(StrictModel):
    id: int
    prompt: str
    answer: str


class LearnerSingleInputContent(StrictModel):
    max_attempts: Literal[3]
    reveal_after_exhaustion: Literal[True]
    items: list[LearnerSingleInputItem]


class LearnerSelfCheckContent(StrictModel):
    items: list[LearnerSingleInputItem]


class LearnerTextPart(StrictModel):
    kind: Literal["text"]
    text: str


class LearnerBlankPart(StrictModel):
    kind: Literal["blank"]
    id: str
    hint: str | None


class LearnerBlankGroupBlank(StrictModel):
    id: str
    word_count: int


class LearnerBlankGroupPart(StrictModel):
    kind: Literal["blank_group"]
    blanks: list[LearnerBlankGroupBlank] = Field(min_length=2)


LearnerFillBlanksPart = Annotated[Union[LearnerTextPart, LearnerBlankPart, LearnerBlankGroupPart], Field(discriminator="kind")]


class LearnerFillBlanksItem(StrictModel):
    id: str
    parts: list[LearnerFillBlanksPart]


class LearnerFillBlanksContent(StrictModel):
    items: list[LearnerFillBlanksItem]


class LearnerExerciseBase(StrictModel):
    slug: str
    title: str
    description: str
    instruction: str
    difficulty: Literal["beginner", "intermediate", "advanced"]
    estimated_duration_minutes: int | None
    schema_version: Literal[1]


class LearnerFormTableExercise(LearnerExerciseBase):
    type_code: Literal["form_table"]
    content: LearnerFormTableContent


class LearnerSingleInputExercise(LearnerExerciseBase):
    type_code: Literal["single_input"]
    content: LearnerSingleInputContent


class LearnerSelfCheckExercise(LearnerExerciseBase):
    type_code: Literal["self_check"]
    content: LearnerSelfCheckContent


class LearnerFillBlanksExercise(LearnerExerciseBase):
    type_code: Literal["fill_blanks"]
    content: LearnerFillBlanksContent


LearnerExerciseResponse = Annotated[
    Union[
        LearnerFormTableExercise,
        LearnerSingleInputExercise,
        LearnerSelfCheckExercise,
        LearnerFillBlanksExercise,
    ],
    Field(discriminator="type_code"),
]
